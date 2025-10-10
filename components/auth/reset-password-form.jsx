"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react"

export function ResetPasswordForm() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [sessionLoading, setSessionLoading] = useState(true)
    const [validSession, setValidSession] = useState(false)
    const [resetToken, setResetToken] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const handleAuthSession = async () => {
            const supabase = getSupabaseBrowserClient()

            try {
                console.log('Checking for password reset authentication...')

                // Sign out first to prevent any existing session from interfering
                await supabase.auth.signOut({ scope: 'global' })
                console.log('Signed out any existing sessions')

                // First check for code in URL (new approach from callback route)
                const urlParams = new URLSearchParams(window.location.search)
                const code = urlParams.get('code')

                if (code) {
                    console.log('Found recovery code in URL parameters')
                    setResetToken(code)
                    setValidSession(true)
                    setSessionLoading(false)
                    return
                }

                // Check for hash parameters (direct magic link format)
                const hashFragment = window.location.hash.substring(1)
                if (hashFragment) {
                    const hashParams = new URLSearchParams(hashFragment)
                    const accessToken = hashParams.get('access_token')
                    const refreshToken = hashParams.get('refresh_token')
                    const type = hashParams.get('type')

                    console.log('Hash - Type:', type, 'Has access token:', !!accessToken)

                    if (type === 'recovery' && accessToken) {
                        try {
                            // Store token for later use but don't establish a session
                            setResetToken(accessToken)
                            setValidSession(true)

                            // Clean URL without page reload
                            window.history.replaceState({}, '', window.location.pathname)
                        } catch (err) {
                            console.error('Token processing error:', err)
                            setError("Failed to process reset link. Please try again.")
                        }
                    } else {
                        setError("Invalid reset link format. Please request a new password reset.")
                    }
                } else {
                    console.log('No valid reset session or hash found')
                    setError("No valid reset session found. Please use the reset link from your email.")
                }

            } catch (error) {
                console.error('Auth session error:', error)
                setError("Authentication error. Please request a new password reset.")
            } finally {
                setSessionLoading(false)
            }
        }

        handleAuthSession()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        // Validate passwords
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.")
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            setLoading(false)
            return
        }

        try {
            const supabase = getSupabaseBrowserClient()

            // Make sure we're signed out first
            await supabase.auth.signOut({ scope: 'local' })

            // Check for code in URL first (new approach)
            const urlParams = new URLSearchParams(window.location.search)
            const code = urlParams.get('code') || resetToken

            let error = null;
            if (code) {
                console.log('Using recovery code to reset password')
                // First verify the OTP token if it's from URL
                if (urlParams.get('code')) {
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        type: 'recovery',
                        token_hash: code
                    })

                    if (verifyError) {
                        console.error('Verification error:', verifyError)
                        setError(`Invalid reset code: ${verifyError.message}`)
                        setLoading(false)
                        return
                    }
                }

                // If token is from hash fragment, need to temporarily establish session
                if (!urlParams.get('code') && resetToken) {
                    const { error: sessionSetError } = await supabase.auth.setSession({
                        access_token: resetToken,
                        refresh_token: ''
                    })

                    if (sessionSetError) {
                        console.error('Session error:', sessionSetError)
                        setError("Invalid or expired reset link. Please request a new password reset.")
                        setLoading(false)
                        return
                    }
                }

                // Update the password
                const { error: resetError } = await supabase.auth.updateUser({
                    password: password
                })
                error = resetError
            } else {
                setError("No valid reset token found. Please request a new password reset.")
                setLoading(false)
                return
            }

            if (error) {
                console.error('Password update error:', error)
                setError(`Failed to update password: ${error.message}`)
            } else {
                console.log('Password updated successfully')
                setSuccess(true)

                // Force complete sign out and redirect after short delay
                setTimeout(async () => {
                    try {
                        console.log('Signing out user after password reset')

                        // Force API call to server to clear auth
                        try {
                            await fetch('/api/auth/logout', {
                                method: 'POST',
                                credentials: 'include',
                            });
                        } catch (apiError) {
                            console.error('API logout error:', apiError)
                        }

                        // Clear all sessions and tokens client-side
                        await supabase.auth.signOut({ scope: 'global' })

                        // Clear any local storage
                        localStorage.removeItem('supabase.auth.token')
                        localStorage.removeItem('sb-access-token')
                        localStorage.removeItem('sb-refresh-token')
                        sessionStorage.clear()

                        // Force redirect to login with page reload
                        window.location.href = "/login?message=Password updated successfully! Please sign in with your new password."
                    } catch (signOutError) {
                        console.error('Sign out error:', signOutError)
                        // Force redirect even if sign out fails
                        window.location.href = "/login?message=Password updated! Please sign in with your new password."
                    }
                }, 2000)
            }
        } catch (error) {
            console.error("Password update error:", error)
            setError(`An error occurred: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Show loading while establishing session
    if (sessionLoading) {
        return (
            <Card className="w-full max-w-md">
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Verifying reset link...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Show error if no valid session
    if (!validSession && error) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-red-600">Reset Link Invalid</CardTitle>
                    <CardDescription className="text-center">
                        This password reset link is invalid or has expired.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <p className="text-sm text-muted-foreground text-center">
                        Please request a new password reset link.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Link href="/forgot-password" className="w-full">
                        <Button className="w-full">
                            Request New Reset Link
                        </Button>
                    </Link>
                    <Link href="/login" className="w-full">
                        <Button variant="ghost" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    if (success) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-center">Password Reset Successful</CardTitle>
                    <CardDescription className="text-center">
                        Your password has been updated successfully! You have been signed out for security.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Please sign in with your new password.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Redirecting to login page...
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Link href="/login" className="w-full">
                        <Button className="w-full">
                            Continue to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Reset Your Password</CardTitle>
                <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password" value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={sessionLoading || loading}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={sessionLoading || loading}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={sessionLoading || loading}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={sessionLoading || loading}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading || sessionLoading || !validSession}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating Password...
                            </>
                        ) : (
                            "Update Password"
                        )}
                    </Button>
                    <Link href="/login" className="w-full">
                        <Button variant="ghost" className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </form>
        </Card>
    )
}
