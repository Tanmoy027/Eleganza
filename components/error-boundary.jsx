"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)

        // Clear any stale data that might be causing issues
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('supabase.auth.token')
                sessionStorage.clear()
            } catch (storageError) {
                console.warn('Error clearing storage:', storageError)
            }
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })

        // Force a complete page refresh to ensure clean state
        if (typeof window !== 'undefined') {
            window.location.reload()
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-md w-full space-y-4">
                        <Alert variant="destructive">
                            <AlertDescription>
                                Something went wrong. This might be due to a temporary connection issue.
                            </AlertDescription>
                        </Alert>

                        <div className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Try refreshing the page. If the problem persists, please contact support.
                            </p>

                            <Button onClick={this.handleReset} className="w-full">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh Page
                            </Button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
                                <summary className="cursor-pointer font-medium">Error Details (Dev)</summary>
                                <pre className="mt-2 whitespace-pre-wrap text-xs">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
