import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    
    // Refresh the auth session
    const {
        data: { user },
    } = await supabase.auth.getUser() 
    // FAKE FOR DEMO PURPOSE
    /*
    const user = { id: "demo-user" } */

    const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes 
    // Check session timeout for authenticated users on protected routes
    if (user) {
        const lastActivity = request.cookies.get('last_activity')?.value
        const now = Date.now()

        if (lastActivity) {
            const elapsed = now - parseInt(lastActivity, 10)
            if (elapsed > SESSION_TIMEOUT_MS) {
                // Session timed out — sign out and redirect to login
                await supabase.auth.signOut()
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                url.searchParams.set('reason', 'session_expired')
                const response = NextResponse.redirect(url)
                response.cookies.delete('last_activity')
                return response
            }
        }

        // Update last activity timestamp on every request
        supabaseResponse.cookies.set('last_activity', String(now), {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_TIMEOUT_MS / 1000,
        })
    }

    // Protected routes: redirect unauthenticated users to login
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    // If user is logged in and hits /login or /signup, redirect to dashboard
    const isAuthRoute =
        request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/signup'
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
