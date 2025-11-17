"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, User, Search, Menu, X, ShoppingCart, Package } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { UserNav } from "@/components/auth/user-nav"
import { Button } from "@/components/ui/button"
import ClientOnly from "@/components/client-only"

export default function AuthNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        let subscription = null

        const fetchUser = async () => {
            try {
                const supabase = getSupabaseBrowserClient()

                // Get initial session
                const { data: { session } } = await supabase.auth.getSession()

                if (mounted && session?.user) {
                    setUser(session.user)

                    // Fetch user profile
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", session.user.id)
                        .single()

                    if (mounted) {
                        setProfile(profileData)
                    }
                }

                if (mounted) {
                    setLoading(false)
                }

                // Listen for auth changes
                const { data: authListener } = supabase.auth.onAuthStateChange(
                    async (event, session) => {
                        if (!mounted) return

                        if (session?.user) {
                            setUser(session.user)

                            // Fetch updated profile
                            const { data: profileData } = await supabase
                                .from("profiles")
                                .select("*")
                                .eq("id", session.user.id)
                                .single()

                            if (mounted) {
                                setProfile(profileData)
                            }
                        } else {
                            setUser(null)
                            setProfile(null)
                        }
                    }
                )

                subscription = authListener.subscription
            } catch (error) {
                console.error("Error fetching user:", error)
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchUser()

        return () => {
            mounted = false
            if (subscription) {
                subscription.unsubscribe()
            }
        }
    }, [])

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    return (
        <header className="border-b border-neutral-200 bg-white sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between py-4">
                    {/* Mobile Menu Button */}
                    <button className="md:hidden" onClick={toggleMobileMenu}>
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>                    {/* Left Navigation - Desktop */}
                    <nav className="hidden md:flex space-x-6 text-xs font-medium uppercase">
                        <Link href="/" className="hover:text-gray-600 transition-colors">
                            Home
                        </Link>
                        <Link href="/offers" className="hover:text-gray-600 transition-colors">
                            Offers
                        </Link>
                        <Link href="/occasions" className="hover:text-gray-600 transition-colors">
                            Occasions
                        </Link>
                        <Link href="/clothing" className="hover:text-gray-600 transition-colors">
                            Clothing
                        </Link>
                    </nav>

                    {/* Logo */}
                    <div className="text-center">
                        <Link href="/">
                            <div className="cursor-pointer">
                                <h1 className="text-lg md:text-xl font-bold uppercase tracking-widest">Eleganza</h1>
                            </div>
                        </Link>
                    </div>                    {/* Right Icons */}
                    <div className="flex items-center space-x-3 md:space-x-4">
                        <ClientOnly fallback={null}>
                            {user && (
                                <Link href="/cart" className="hidden sm:block">
                                    <ShoppingCart className="w-5 h-5 hover:text-gray-600 transition-colors" />
                                </Link>
                            )}
                            {user && (
                                <Link href="/wishlist" className="hidden sm:block">
                                    <Heart className="w-5 h-5 hover:text-gray-600 transition-colors" />
                                </Link>
                            )}
                        </ClientOnly>

                        <Link href="/search">
                            <Search className="w-5 h-5 hover:text-gray-600 transition-colors" />
                        </Link>

                        {/* Authentication Section */}
                        <ClientOnly fallback={<div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>}>
                            {user ? (
                                <UserNav user={{ ...user, profile }} />
                            ) : (
                                <>
                                    <div className="hidden sm:flex items-center space-x-2">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href="/login">Login</Link>
                                        </Button>
                                        <Button size="sm" asChild>
                                            <Link href="/signup">Sign Up</Link>
                                        </Button>
                                    </div>
                                    <Link href="/login" className="sm:hidden">
                                        <User className="w-5 h-5 hover:text-gray-600 transition-colors" />
                                    </Link>
                                </>
                            )}
                        </ClientOnly>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 py-4">                        <nav className="flex flex-col space-y-4 text-sm font-medium uppercase">
                        <Link
                            href="/"
                            className="hover:text-gray-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/offers"
                            className="hover:text-gray-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Offers
                        </Link>
                        <Link
                            href="/occasions"
                            className="hover:text-gray-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Occasions
                        </Link>
                        <Link
                            href="/clothing"
                            className="hover:text-gray-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Clothing
                        </Link><ClientOnly fallback={null}>
                            {user && (
                                <div className="pt-4 border-t border-gray-200">
                                    <Link
                                        href="/cart"
                                        className="flex items-center space-x-2 hover:text-gray-600 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        <span>Cart</span>
                                    </Link>                                        <Link
                                        href="/wishlist"
                                        className="flex items-center space-x-2 hover:text-gray-600 transition-colors mt-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Heart className="w-4 h-4" />
                                        <span>Wishlist</span>
                                    </Link>
                                    <Link
                                        href="/orders"
                                        className="flex items-center space-x-2 hover:text-gray-600 transition-colors mt-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Package className="w-4 h-4" />
                                        <span>My Orders</span>
                                    </Link>
                                    <Link
                                        href="/account"
                                        className="flex items-center space-x-2 hover:text-gray-600 transition-colors mt-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <User className="w-4 h-4" />
                                        <span>Account</span>
                                    </Link>
                                    {profile?.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            className="flex items-center space-x-2 hover:text-gray-600 transition-colors mt-2"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            <span>Admin Dashboard</span>
                                        </Link>
                                    )}
                                </div>
                            )}

                            {!user && (
                                <div className="pt-4 border-t border-gray-200 space-y-2">
                                    <Link
                                        href="/login"
                                        className="block text-center py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="block text-center py-2 px-4 border border-black rounded hover:bg-gray-50 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </ClientOnly>
                    </nav>
                    </div>
                )}
            </div>
        </header>
    )
}
