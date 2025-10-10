"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, User, Search, Menu, X, ShoppingCart } from "lucide-react"

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
          </button>

          {/* Left Navigation - Desktop */}
          <nav className="hidden md:flex space-x-6 text-xs font-medium uppercase">
            <Link href="/" className="hover:text-gray-600 transition-colors">
              New In
            </Link>
            <Link href="/dresses" className="hover:text-gray-600 transition-colors">
              Dresses
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
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-3 md:space-x-4">
            <Link href="/cart" className="hidden sm:block">
              <ShoppingCart className="w-5 h-5 hover:text-gray-600 transition-colors" />
            </Link>
            <Link href="/wishlist" className="hidden sm:block">
              <Heart className="w-5 h-5 hover:text-gray-600 transition-colors" />
            </Link>
            <Link href="/account" className="hidden sm:block">
              <User className="w-5 h-5 hover:text-gray-600 transition-colors" />
            </Link>
            <Link href="/search">
              <Search className="w-5 h-5 hover:text-gray-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4 text-sm font-medium uppercase">
              <Link
                href="/"
                className="hover:text-gray-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                New In
              </Link>
              <Link
                href="/dresses"
                className="hover:text-gray-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dresses
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
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/cart"
                  className="flex items-center space-x-2 hover:text-gray-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Cart</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center space-x-2 hover:text-gray-600 transition-colors mt-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Heart className="w-4 h-4" />
                  <span>Wishlist</span>
                </Link>
                <Link
                  href="/account"
                  className="flex items-center space-x-2 hover:text-gray-600 transition-colors mt-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Account</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
