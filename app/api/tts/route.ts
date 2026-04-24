import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp, TTS_LIMIT } from '@/lib/security/rate-limit'

// Converts raw L16 PCM (16-bit LE, 24kHz, mono) to a minimal WAV buffer
function pcmToWav(pcm: Buffer): Buffer {
  const numChannels = 1
  const sampleRate = 24000
  const bitsPerSample = 16
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = pcm.length
  const header = Buffer.alloc(44)

  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)           // PCM format
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return Buffer.concat([header, pcm])
}

export async function POST(req: NextRequest) {
  try {
    // Auth check — prevent anonymous API cost abuse
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit per user ID (more accurate than IP for authenticated routes)
    const { allowed, resetInMs } = await checkRateLimit(user.id, TTS_LIMIT)
    if (!allowed) return NextResponse.json(
      { error: 'Too many TTS requests, please slow down.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) } }
    )

    const { text } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    // Use REST API directly — avoids SDK serialization issues with responseModalities
    console.log("[TTS] request sent")
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text.trim() }] }],
          generationConfig: {
            responseModalities: ['TEXT'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Aoede' },
              },
            },
          },
        }),
      }
    )

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('[TTS] Gemini API error:', resp.status, errText)
      return NextResponse.json({ error: 'Failed to generate audio. Please try again.' }, { status: 502 })
    }

    const data = await resp.json()
    const audioPart = data.candidates?.[0]?.content?.parts?.[0]

    if (!audioPart?.inlineData?.data) {
      console.error('[TTS] No audio in response:', JSON.stringify(data).slice(0, 300))
      return NextResponse.json({ error: 'No audio returned' }, { status: 502 })
    }

    const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64')
    const wavBuffer = pcmToWav(pcmBuffer)

    return new NextResponse(new Uint8Array(wavBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(wavBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[TTS] Error:', msg)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

