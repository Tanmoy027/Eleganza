"use client"

import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

export function LogoutButton({ className }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleLogout = async () => {
        setIsLoading(true)
        try {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.auth.signOut()

            if (error) {
                console.error('Logout error:', error)
                alert('Error logging out: ' + error.message)
            } else {
                router.push('/')
                router.refresh()
            }
        } catch (error) {
            console.error('Logout error:', error)
            alert('Error logging out')
        } finally {
            setIsLoading(false)
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
