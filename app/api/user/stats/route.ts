import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export async function GET(req: NextRequest) {
  // Get user_id from query params
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const { data: stats, error } = await supabaseAdmin
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }

  // Return stats or default values if null
  return NextResponse.json(stats ?? { 
    total_sessions: 0, 
    total_questions: 0, 
    topics_completed: 0, 
    study_time: 0 
  })
}