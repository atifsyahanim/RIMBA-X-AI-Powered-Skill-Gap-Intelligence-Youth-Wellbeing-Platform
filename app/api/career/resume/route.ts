import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit'
import { RESUME_GEN_PROMPT } from '@/lib/career/prompts'
import { safeParseJson } from '@/lib/career/parser'
import { getGeminiModel } from '@/lib/ai/gemini'
import { awardXP } from '@/lib/gamification'
import { sanitizeInput } from '@/lib/security/sanitization'
import { z } from 'zod'
import type { CareerProfile, UserCertificate, LearningModule, ResumeContent } from '@/types'

const resumeSchema = z.object({
  target_role: z.string().min(1).max(200),
  version_name: z.string().max(100).optional(),
  tone: z.enum(['professional', 'creative', 'technical']).optional().default('professional'),
})

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed } = await checkRateLimit(ip, { name: 'career', max: 5, windowMs: 60 * 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = resumeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 })

  const { target_role, version_name, tone } = parsed.data

  // Fetch all needed data in parallel
  const [profileRes, certsRes, modulesRes, countRes] = await Promise.all([
    supabase.from('career_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_certificates').select('*').eq('user_id', user.id),
    supabase.from('learning_modules').select('*').eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('resume_versions').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  if (!profileRes.data) {
    return NextResponse.json({ error: 'Complete your career profile first' }, { status: 400 })
  }

  const profile = profileRes.data as CareerProfile
  const certs = (certsRes.data ?? []) as UserCertificate[]
  const modules = (modulesRes.data ?? []) as LearningModule[]
  const isFirstResume = (countRes.count ?? 0) === 0

  const model = getGeminiModel('gemini-2.5-flash')
  const prompt = RESUME_GEN_PROMPT(profile, certs, modules, sanitizeInput(target_role), tone)

  let rawText = ''
  try {
    const result = await model.generateContent(prompt)
    rawText = result.response.text()
  } catch {
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
  }

  const resumeContent = safeParseJson<ResumeContent & { ats_score?: number }>(rawText)
  if (!resumeContent) {
    return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
  }

  const atsScore = resumeContent.ats_score ?? null
  const improvementTips = resumeContent.improvement_tips ?? []
  // Remove meta fields from stored content
  const contentToStore: ResumeContent = {
    summary: resumeContent.summary ?? '',
    experience: resumeContent.experience ?? [],
    education: resumeContent.education ?? [],
    skills: resumeContent.skills ?? { technical: [], soft: [] },
    certifications: resumeContent.certifications ?? [],
    projects: resumeContent.projects ?? [],
    improvement_tips: improvementTips,
  }

  const versionCount = (countRes.count ?? 0) + 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resume, error: saveErr } = await (supabase.from('resume_versions') as any)
    .insert({
      user_id: user.id,
      version_name: version_name ? sanitizeInput(version_name) : `Resume v${versionCount}`,
      target_role: sanitizeInput(target_role),
      content_json: contentToStore,
      ai_feedback: improvementTips.join('\n'),
      ats_score: atsScore,
    })
    .select()
    .single()

  if (saveErr) return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 })

  if (isFirstResume) {
    await awardXP(user.id, 100, 'First AI resume generated')
  }

  return NextResponse.json({ resume, ats_score: atsScore, improvement_tips: improvementTips })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: resumes } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ resumes: resumes ?? [] })
}
