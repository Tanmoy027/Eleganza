"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AuthTestPage() {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = getSupabaseBrowserClient()

            // Get session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            setSession(session)

            if (sessionError) {
                console.error("Session error:", sessionError)
            }

            // Get user
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            setUser(user)

            if (userError) {
                console.error("User error:", userError)
            }

            // Get profile if user exists
            if (user) {
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

                setProfile(profileData)

                if (profileError) {
                    console.error("Profile error:", profileError)
                }
            }

            setLoading(false)
        }

        checkAuth()
    }, [])

    if (loading) {
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>

            <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Session</h2>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">User</h2>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Profile</h2>
                    <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                        {JSON.stringify(profile, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}
