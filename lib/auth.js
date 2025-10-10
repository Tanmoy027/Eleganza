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
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    // If profile doesn't exist, create it
    if (profileError && profileError.code === "PGRST116") {
      console.log("Profile not found, creating new profile for user")
      const { error: insertError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || "",
        role: "user",
      })

      if (insertError) {
        console.error("Error creating profile:", insertError)
        throw new Error("Failed to create user profile")
      }

      // Set default user role for newly created profile
      profile = { role: "user" }
    } else if (profileError) {
      console.error("Error fetching user profile:", profileError)
      throw new Error("Failed to fetch user profile")
    }

    // Add a small delay to ensure session is properly set
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Redirect based on user role using window.location for immediate redirect
    if (profile?.role === "admin") {
      window.location.href = "/admin"
    } else {
      window.location.href = "/"
    }
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
