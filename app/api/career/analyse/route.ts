import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit'
import { SKILL_GAP_PROMPT } from '@/lib/career/prompts'
import { parseGapAnalysis, deriveModulesFromGap } from '@/lib/career/parser'
import { getResourcesForSkill } from '@/lib/career/resources'
import { getGeminiModel } from '@/lib/ai/gemini'
import { awardXP } from '@/lib/gamification'
import type { CareerProfile } from '@/types'

// Create Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

// Helper to get user from request
async function getUserFromRequest(req: NextRequest) {
  // Get the authorization header
  const authHeader = req.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) return user;
  }
  
  // Try to get from cookie (browser requests)
  const { data: { user } } = await supabaseAdmin.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  
  console.log("GET /analyse - User ID:", user?.id)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('skill_gap_analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: profile } = await supabaseAdmin
    .from('career_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ 
    data: data ?? null, 
    hasProfile: !!profile 
  })
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed } = await checkRateLimit(ip, { name: 'career', max: 10, windowMs: 60 * 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const user = await getUserFromRequest(req);
  
  console.log("POST /analyse - User ID:", user?.id)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Fetch career profile
  const { data: profile } = await supabaseAdmin
    .from('career_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: 'Complete your career profile first' }, { status: 400 })
  }

  // Generate skill gap analysis with Gemini
  console.log("[ANALYSE] starting gemini call")
  const model = getGeminiModel('gemini-2.5-flash')
  const prompt = SKILL_GAP_PROMPT(profile as CareerProfile)

  let rawText = ''
  try {
    const result = await model.generateContent(prompt)
    console.log("[ANALYSE] gemini response received")
    rawText = result.response.text()
  } catch (err: any) {
      console.error("GEMINI ERROR:", err)
      return NextResponse.json({
        error: "AI analysis failed",
        details: err?.message || err
      }, { status: 500 })
    }

  const gapData = parseGapAnalysis(rawText)
  console.log("[RAW GEMINI OUTPUT]", rawText)
  if (!gapData || !gapData.gap_skills?.length) {
    console.error("[ANALYSE] parse failed", rawText)
    return NextResponse.json(
      { error: "AI returned invalid structure" },
      { status: 500 }
    )
  }

  // Enrich gap skills with curated resources where AI didn't provide any
  gapData.gap_skills = gapData.gap_skills.map(g => ({
    ...g,
    resources: g.resources?.length ? g.resources : getResourcesForSkill(g.skill),
  }))

  // Save analysis
  const careerProfile = profile as CareerProfile
  const { data: analysis, error: analysisErr } = await supabaseAdmin
    .from('skill_gap_analyses')
    .insert({
      user_id: user.id,
      target_career: careerProfile.target_career,
      required_skills: gapData.required_skills,
      current_skills: careerProfile.skills,
      gap_skills: gapData.gap_skills,
      match_score: Math.min(100, Math.max(0, gapData.match_score)),
      ai_summary: gapData.ai_summary,
    })
    .select()
    .single()

  if (analysisErr || !analysis) {
    console.error("Save analysis error:", analysisErr)
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
  }

  // Replace stale modules with fresh ones from this analysis
  await supabaseAdmin.from('learning_modules').delete().eq('user_id', user.id)

  // Auto-generate learning modules  
  const moduleDefs = deriveModulesFromGap(user.id, analysis.id, gapData)
  console.log("MODULES TO INSERT:", moduleDefs)
  const { data: modules, error: moduleErr } = await supabaseAdmin
    .from('learning_modules')
    .insert(moduleDefs)
    .select()

  console.log("MODULE INSERT ERROR:", moduleErr)
  console.log("MODULE INSERT RESULT:", modules)

  // Award XP
  await awardXP(user.id, 75, 'Skill gap analysis completed')

  return NextResponse.json({ data: analysis, modules: modules ?? [] })
}