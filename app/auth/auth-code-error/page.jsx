import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <CardTitle className="text-center text-red-600">Authentication Error</CardTitle>
                    <CardDescription className="text-center">
                        There was a problem processing your password reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <p>This could happen if:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>The reset link has expired</li>
                            <li>The link has already been used</li>
                            <li>There was a network issue</li>
                        </ul>
                        <p className="mt-4">Please request a new password reset link to continue.</p>
                    </div>
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
        </div>
    )
}
