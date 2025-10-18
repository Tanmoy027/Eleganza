"use client"

import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAppState } from '@/components/providers/app-state-provider'
import { withRetry, clearAllCache } from '@/lib/utils'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export function LogoutButton({ className }) {
    const router = useRouter()
    const { setOperationState, isOperationActive } = useAppState()
    const [isLoading, setIsLoading] = useState(false)

    const handleLogout = async () => {
        if (isLoading || isOperationActive('logout')) return // Prevent multiple clicks

        setIsLoading(true)
        setOperationState('logout', true)

        try {
            const supabase = getSupabaseBrowserClient()

            // Use retry utility for sign out
            await withRetry(async () => {
                const { error } = await supabase.auth.signOut({ scope: 'global' })
                if (error) {
                    throw error
                }
            }, 3, 500)

            // Clear all cached data
            clearAllCache()

            // Force a complete refresh to ensure clean state
            window.location.replace('/')
        } catch (error) {
            console.error('Logout error:', error)
            // Clear storage and force redirect even on error
            clearAllCache()
            window.location.replace('/')
        } finally {
            setIsLoading(false)
            setOperationState('logout', false)
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className={className}
        >
            <LogOut className="w-5 h-5" />
            <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
        </button>
    )
}
