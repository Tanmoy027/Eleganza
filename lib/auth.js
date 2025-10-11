import { getSupabaseBrowserClient, getSupabaseClient } from "./supabase/client"
import { getAuthRedirectUrl } from "./url-utils"

// Client-side auth that works everywhere
export function getClientAuth() {
  const supabase = getSupabaseBrowserClient()
  return supabase.auth
}

// For pages directory (used in getServerSideProps)
export async function getServerSideAuthForPages(context) {
  const { getSupabasePagesServerClient } = await import("./supabase/pages-server")
  const supabase = await getSupabasePagesServerClient(context)
  return supabase.auth.getSession()
}

export async function signUp(email, password, fullName) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: getAuthRedirectUrl("/"),
    },
  })

  return { data, error }
}

export async function signIn(email, password) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Sign in error:", error)
  }

  return { data, error }
}

export async function signInAndRedirect(email, password, router) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  // Get user profile to determine redirect
  if (data?.user) {
    // Add a small delay to ensure session is properly set
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      // If profile exists and user is admin, redirect to admin
      if (!profileError && profile?.role === "admin") {
        window.location.href = "/admin"
        return { data, error }
      }
    } catch (profileError) {
      console.log("Could not fetch user profile, continuing with regular user access")
    }

    // For all other cases (no profile, regular user, or profile fetch error)
    // redirect to home page
    window.location.href = "/"
  }

  return { data, error }
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Sign out error:", error)
    throw error
  }

  return { error: null }
}

// Add any other auth functions your client components need
// Make sure they use the client version of Supabase

export async function getCurrentUser() {
  const supabase = getSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get profile data
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return { ...user, profile }
}

export async function isAdmin() {
  const supabase = getSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  return profile?.role === "admin"
}

export async function resetPassword(email) {
  const supabase = getSupabaseBrowserClient()

  // Use the full URL to ensure correct handling of the reset link
  const redirectUrl = `${window.location.origin}/reset-password`
  console.log(`Setting password reset redirect URL to: ${redirectUrl}`)

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  })

  return { data, error }
}

export async function updatePassword(newPassword) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  return { data, error }
}
