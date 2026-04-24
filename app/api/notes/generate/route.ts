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
    if (authError) console.error('[notes/generate] auth error:', authError.message)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { documentId } = body

    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Verify the document belongs to this user
    const { data: doc, error: docError } = await serviceClient
      .from('documents')
      .select('id, filename, title, subject, parsed_text')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Fetch up to 30 content chunks for this document
    const { data: chunks, error: chunksError } = await serviceClient
      .from('document_embeddings')
      .select('content, chunk_index')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('chunk_index', { ascending: true })
      .limit(30)

    if (chunksError) {
      console.error('[notes/generate] chunks error:', chunksError)
      return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 })
    }

    // Fall back to the raw parsed_text saved at upload time if embeddings are missing
    let resourceText: string
    if (!chunks || chunks.length === 0) {
      const fallback = (doc as Record<string, unknown>).parsed_text as string | null | undefined
      if (!fallback || fallback.trim().length === 0) {
        return NextResponse.json({ error: 'Document has no processed content yet. Please re-upload the file.' }, { status: 422 })
      }
      resourceText = fallback
    } else {
      resourceText = chunks.map(c => c.content).join('\n\n')
    }
    const resourceFilename = doc.filename || doc.title || 'document'

    const prompt = `Based on this resource content:

${resourceText}

Generate structured study notes in valid JSON with exactly this shape:
{
  "title": "short topic/chapter name (max 8 words)",
  "concepts": ["concept 1", "concept 2", "concept 3", "concept 4", "concept 5"],
  "keyTerms": ["Term1: brief definition", "Term2: brief definition", "Term3: brief definition"]
}

Rules:
- 5-6 concept bullets, each a concise single sentence
- Mark key terms inside concepts with **double asterisks** around the term only (e.g. "**Photosynthesis** converts light into energy")
- 3-5 key terms with short definitions
- Derive everything strictly from the provided content
- Output valid JSON only — no markdown fences, no extra text`

    const model = getGeminiModel('gemini-2.5-flash')
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
    })

    const raw = result.response.text().trim()
    // Strip markdown fences if model adds them anyway
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { title: string; concepts: string[]; keyTerms: string[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('[notes/generate] JSON parse failed, raw:', raw.slice(0, 300))
      return NextResponse.json({ error: 'AI returned unexpected format. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      title: String(parsed.title || doc.title || resourceFilename),
      resourceFilename,
      documentId,
      concepts: Array.isArray(parsed.concepts) ? parsed.concepts.slice(0, 6) : [],
      keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms.slice(0, 5) : [],
    })
  } catch (e) {
    console.error('[notes/generate] uncaught:', e)
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 })
  }
}
