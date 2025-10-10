import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const type = searchParams.get("type")
    const next = searchParams.get("next") ?? "/reset-password"

    if (code) {
        let supabaseResponse = NextResponse.next({
            request,
        })

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

        // For password recovery type, don't exchange for session but redirect to reset page with code
        if (type === 'recovery') {
            const redirectUrl = new URL(`${origin}/reset-password`)
            redirectUrl.searchParams.append('code', code)
            return NextResponse.redirect(redirectUrl.toString())
        }

        // For other auth types (signup, login, etc.), proceed normally
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get("x-forwarded-host")
            const isLocalEnv = process.env.NODE_ENV === "development"

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
