import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit'
import { CAREER_RECOMMEND_PROMPT } from '@/lib/career/prompts'
import { parseRecommendations } from '@/lib/career/parser'
import { getGeminiModel } from '@/lib/ai/gemini'
import type { CareerProfile } from '@/types'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed } = await checkRateLimit(ip, { name: 'career', max: 10, windowMs: 60 * 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase
    .from('career_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'Complete your career profile first' }, { status: 400 })
  }

  const model = getGeminiModel('gemini-2.5-flash')
  const prompt = CAREER_RECOMMEND_PROMPT(profile as CareerProfile)

  let rawText = ''
  try {
    const result = await model.generateContent(prompt)
    rawText = result.response.text()
  } catch {
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }

  const data = parseRecommendations(rawText)
  if (!data) {
    return NextResponse.json({ error: 'Failed to parse recommendations. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ recommendations: data.recommendations })
}
