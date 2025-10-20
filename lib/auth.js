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

export async function checkEmailExists(email) {
  const supabase = getSupabaseBrowserClient()

  // Check if user exists in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single()

  // If we get data, email exists
  if (data) {
    return true
  }

  // If error is "PGRST116" (no rows found), email doesn't exist
  if (error && error.code === 'PGRST116') {
    return false
  }

  // For any other error, assume email might exist (safer approach)
  return true
}

export async function signUp(email, password, fullName) {
  const supabase = getSupabaseBrowserClient()

  // First check if email already exists in our profiles table
  const emailExists = await checkEmailExists(email)
  if (emailExists) {
    return {
      data: null,
      error: { message: "An account with this email already exists. Please use a different email or try logging in." }
    }
  }

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

  // Handle various Supabase error scenarios
  if (error) {
    // Check for common duplicate email error messages from Supabase
    if (error.message?.includes('User already registered') || 
        error.message?.includes('already been registered') ||
        error.message?.includes('email already exists')) {
      return {
        data: null,
        error: { message: "An account with this email already exists. Please use a different email or try logging in." }
      }
    }
    return { data, error }
  }

  // Handle case where Supabase returns success but user already exists
  // This can happen when email confirmation is disabled
  if (data?.user && data?.user?.identities && data.user.identities.length === 0) {
    return {
      data: null,
      error: { message: "An account with this email already exists. Please use a different email or try logging in." }
    }
  }

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
    // Add a longer delay to ensure session is properly set
    await new Promise((resolve) => setTimeout(resolve, 300))

    try {
      // Add retry logic for profile fetch
      let profileRetries = 0
      const maxProfileRetries = 3
      let profile = null
      let profileError = null

      while (profileRetries < maxProfileRetries) {
        const result = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        if (!result.error) {
          profile = result.data
          break
        } else {
          profileError = result.error
          profileRetries++
          if (profileRetries < maxProfileRetries) {
            await new Promise(resolve => setTimeout(resolve, 200 * profileRetries))
          }
        }
      }

      // If profile exists and user is admin, redirect to admin
      if (!profileError && profile?.role === "admin") {
        // Use replace to prevent back button issues
        window.location.replace("/admin")
        return { data, error }
      }
    } catch (profileError) {
      console.log("Could not fetch user profile, continuing with regular user access:", profileError)
    }

    // For all other cases (no profile, regular user, or profile fetch error)
    // redirect to home page
    window.location.replace("/")
  }

  return { data, error }
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient()

  try {
    // Sign out from all sessions
    const { error } = await supabase.auth.signOut({ scope: 'global' })

    if (error) {
      console.error("Sign out error:", error)
      // Even if there's an error, clear local session
      localStorage.clear()
      sessionStorage.clear()
      throw error
    }

    // Clear any cached data
    localStorage.clear()
    sessionStorage.clear()

    return { error: null }
  } catch (error) {
    console.error("Sign out error:", error)
    // Force clear local storage even on error
    localStorage.clear()
    sessionStorage.clear()
    throw error
  }
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
