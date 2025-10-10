"use client"

import { useState } from "react"
import { resetPassword } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(false)

        console.log('Sending password reset email to:', email)

        try {
            const { error } = await resetPassword(email)

            if (error) {
                console.error('Password reset error:', error)
                // Handle specific error types
                if (error.message.includes('rate limit')) {
                    setError("Too many reset requests. Please wait a few minutes before trying again.")
                } else if (error.message.includes('not found')) {
                    setError("No account found with this email address.")
                } else {
                    setError(`Error: ${error.message}`)
                }
            } else {
                console.log('Password reset email sent successfully')
                setSuccess(true)
            }
        } catch (error) {
            console.error("Password reset error:", error)
            if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
                setError("Request timed out. Please check your internet connection and try again.")
            } else {
                setError("An unexpected error occurred. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-center">Check your email</CardTitle>
                    <CardDescription className="text-center">
                        We've sent a password reset link to <strong>{email}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                        Click the link in the email to reset your password. If you don't see it, check your spam folder.
                    </p>
                </CardContent>
                <CardFooter>
                    <Link href="/login" className="w-full">
                        <Button variant="outline" className="w-full bg-transparent">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Forgot Password?</CardTitle>
                <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <Link href="/login" className="w-full">
                        <Button variant="ghost" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Button>
                    </Link>
                </CardFooter>
            </form>
        </Card>
    )
}
