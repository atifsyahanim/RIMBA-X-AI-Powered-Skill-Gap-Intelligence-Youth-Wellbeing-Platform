import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit'

// Use the admin client directly (same as your profile API)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed } = await checkRateLimit(ip, { name: 'career', max: 100, windowMs: 15 * 60 * 1000 })
  if (!allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  // Get user from authorization header
  const authHeader = req.headers.get('authorization')
  let userId = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (!error && user) userId = user.id
  }
  
  // If no token, try to get from cookie (fallback)
  if (!userId) {
    const { data: { user } } = await supabaseAdmin.auth.getUser()
    userId = user?.id
  }
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('learning_modules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status && ['not_started', 'in_progress', 'completed'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data: modules, error } = await query
  if (error) {
    console.error("Modules fetch error:", error)
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 })
  }

  return NextResponse.json({ modules: modules ?? [] })
}