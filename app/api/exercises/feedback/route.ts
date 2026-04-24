import { createClient } from '@/lib/supabase/server'
import { getGeminiModel } from '@/lib/ai/gemini'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, API_LIMIT } from '@/lib/security/rate-limit'

export const runtime = 'nodejs'

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
    if (authError) console.error('[exercises/feedback] auth error:', authError.message)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { type, question, correctAnswer, userAnswer, task, submission } = body

    if (!type || !['quickcheck', 'guided'].includes(type)) {
      return NextResponse.json({ error: 'type must be quickcheck or guided' }, { status: 400 })
    }

    const MAX_LEN = 2000
    const safeStr = (v: unknown) => typeof v === 'string' ? v.slice(0, MAX_LEN) : ''

    const model = getGeminiModel('gemini-2.5-flash')

    if (type === 'quickcheck') {
      const q = safeStr(question)
      const correct = safeStr(correctAnswer)
      const userAns = safeStr(userAnswer)

      if (!q || !correct || !userAns) {
        return NextResponse.json({ error: 'question, correctAnswer, and userAnswer are required for quickcheck' }, { status: 400 })
      }

      const prompt = `The question was: "${q}"
The correct answer is: "${correct}"
The user selected: "${userAns}"

Give brief feedback in valid JSON:
{
  "right": "1-2 sentences on what the user got right (or acknowledge a correct answer)",
  "fix": "1-2 sentences on what to fix or reinforce (or say 'Great job!' if fully correct)"
}

Output valid JSON only — no markdown fences, no extra text.`

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 250 },
      })

      const raw = result.response.text().trim()
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

      let parsed: { right: string; fix: string }
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        return NextResponse.json({ error: 'AI returned unexpected format. Please try again.' }, { status: 500 })
      }

      return NextResponse.json({
        right: String(parsed.right || ''),
        fix: String(parsed.fix || ''),
      })
    }

    // type === 'guided'
    const taskText = safeStr(task)
    const sub = safeStr(submission)

    if (!taskText || !sub) {
      return NextResponse.json({ error: 'task and submission are required for guided' }, { status: 400 })
    }

    const prompt = `The task was: "${taskText}"
The user submitted: "${sub}"

Evaluate their response in valid JSON:
{
  "qualityLabel": "Strong" | "Good" | "Needs Work",
  "feedback": "2-3 sentences: what was correct, what was missing, one thing to improve",
  "suggestion": "one specific concept or topic to review"
}

Output valid JSON only — no markdown fences, no extra text.`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 350 },
    })

    const raw = result.response.text().trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { qualityLabel: string; feedback: string; suggestion: string }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'AI returned unexpected format. Please try again.' }, { status: 500 })
    }

    const validLabels = ['Strong', 'Good', 'Needs Work']
    return NextResponse.json({
      qualityLabel: validLabels.includes(parsed.qualityLabel) ? parsed.qualityLabel : 'Good',
      feedback: String(parsed.feedback || ''),
      suggestion: String(parsed.suggestion || ''),
    })
  } catch (e) {
    console.error('[exercises/feedback] uncaught:', e)
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 })
  }
}
