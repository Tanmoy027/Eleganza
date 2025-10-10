import { getSupabaseServerClient } from "./supabase/server"
import { redirect } from "next/navigation"

export async function signOut() {
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('Server sign out error:', error)
        throw error
    }

    return { error: null }
}

export async function handleLogout() {
    "use server"

    try {
        await signOut()
        redirect("/")
    } catch (error) {
        console.error("Logout error:", error)
        redirect("/")
    }
}
