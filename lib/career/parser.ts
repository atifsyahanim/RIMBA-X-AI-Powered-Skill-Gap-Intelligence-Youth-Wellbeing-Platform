import type { SkillGapAnalysis, LearningModule } from '@/types'

/** Strip markdown code fences and return raw JSON string */
function stripFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
}

/** Safely parse a JSON string returned by Gemini */
export function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(stripFences(raw)) as T
  } catch {
    // Try to extract the first JSON object/array from the string
    const match = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (match) {
      try {
        return JSON.parse(match[0]) as T
      } catch {
        return null
      }
    }
    return null
  }
}

export interface RawGapAnalysis {
  required_skills: { skill: string; importance: string; category: string }[]
  gap_skills: {
    skill: string
    importance: string
    category: string
    estimatedHours: number
    resources: { title: string; url: string; type: string; free: boolean }[]
  }[]
  match_score: number
  ai_summary: string
}

export interface RawRecommendations {
  recommendations: {
    title: string
    fit_score: number
    description: string
    required_skills: string[]
    salary_range_myr: { min: number; max: number }
    growth_outlook: string
    why_good_fit: string
  }[]
}

export function parseGapAnalysis(raw: string): RawGapAnalysis | null {
  const data = safeParseJson<RawGapAnalysis>(raw)
  if (!data || !Array.isArray(data.gap_skills)) return null
  return data
}

export function parseRecommendations(raw: string): RawRecommendations | null {
  const data = safeParseJson<RawRecommendations>(raw)
  if (!data || !Array.isArray(data.recommendations)) return null
  return data
}

/** Derive modules from a gap analysis (one module per gap skill) */
export function deriveModulesFromGap(
  userId: string,
  analysisId: string,
  gapData: RawGapAnalysis
): Omit<Parameters<typeof placeholder>[0], 'id' | 'created_at'>[] {
  return gapData.gap_skills.map((g, i) => ({
    user_id: userId,
    gap_analysis_id: analysisId,
    title: `Master ${g.skill}`,
    skill_target: g.skill,
    description: `Close your gap in ${g.skill}`,
    level: i + 1,
    status: "not_started",
    completion_pct: 0,
    resources: g.resources ?? [],
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function placeholder(_: any) { return _ }

function importanceToDifficulty(importance: string): LearningModule['difficulty'] {
  if (importance === 'critical') return 'intermediate'
  if (importance === 'important') return 'beginner'
  return 'beginner'
}
