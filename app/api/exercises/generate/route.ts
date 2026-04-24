import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getGeminiModel } from '@/lib/ai/gemini'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, API_LIMIT } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

const getServiceClient = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const { allowed, resetInMs } = await checkRateLimit(ip, API_LIMIT)
    if (!allowed) return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) } }
    )

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) console.error('[exercises/generate] auth error:', authError.message)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { documentId } = body

    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Verify ownership
    const { data: doc } = await serviceClient
      .from('documents')
      .select('id, filename, title')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Fetch content chunks
    const { data: chunks, error: chunksError } = await serviceClient
      .from('document_embeddings')
      .select('content, chunk_index')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('chunk_index', { ascending: true })
      .limit(25)

    if (chunksError || !chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'Document has no processed content yet.' }, { status: 422 })
    }

    const resourceText = chunks.map(c => c.content).join('\n\n')

    const prompt = `Based on this resource content:

${resourceText}

Generate exactly ONE multiple-choice question and ONE guided practice task in valid JSON:
{
  "quickCheck": {
    "question": "clear question text",
    "options": [
      { "label": "a", "text": "option text" },
      { "label": "b", "text": "option text" },
      { "label": "c", "text": "option text" },
      { "label": "d", "text": "option text" }
    ],
    "correctIndex": 0,
    "explanation": "1-2 sentence explanation of the correct answer"
  },
  "guidedPractice": {
    "task": "open-ended task or scenario prompt (1-2 sentences). Ask the student to explain, describe, or apply a concept from the material."
  }
}

Rules:
- correctIndex is 0-based (0 = option a, 1 = b, 2 = c, 3 = d)
- All content must come from the resource text above
- Keep questions clear and unambiguous
- Output valid JSON only — no markdown fences, no extra text`

    const model = getGeminiModel('gemini-2.5-flash')
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 700 },
    })

    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: {
      quickCheck: {
        question: string
        options: { label: string; text: string }[]
        correctIndex: number
        explanation: string
      }
      guidedPractice: { task: string }
    }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('[exercises/generate] JSON parse failed, raw:', raw.slice(0, 300))
      return NextResponse.json({ error: 'AI returned unexpected format. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      documentId,
      quickCheck: {
        question: String(parsed.quickCheck?.question || ''),
        options: Array.isArray(parsed.quickCheck?.options) ? parsed.quickCheck.options.slice(0, 4) : [],
        correctIndex: Number(parsed.quickCheck?.correctIndex ?? 0),
        explanation: String(parsed.quickCheck?.explanation || ''),
      },
      guidedPractice: {
        task: String(parsed.guidedPractice?.task || ''),
      },
    })
  } catch (e) {
    console.error('[exercises/generate] uncaught:', e)
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 })
  }
}
