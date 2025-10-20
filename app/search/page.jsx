"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SearchIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createBrowserClient } from "@supabase/ssr"
import { getProductMainImage, handleImageError } from "@/lib/image-utils"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery)
    } else {
      setResults([])
    }
  }, [searchQuery])

  const performSearch = async (query) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(20)

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      performSearch(searchQuery)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Search</h1>

          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-gray-600 mb-6">
              Found {results.length} {results.length === 1 ? "result" : "results"} for "{searchQuery}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="bg-white rounded-lg shadow overflow-hidden group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={getProductMainImage(product)}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 capitalize">{product.category}</p>
                    <p className="font-semibold">৳{product.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : searchQuery.trim() ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">No results found</h2>
            <p className="text-gray-600">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">Start searching</h2>
            <p className="text-gray-600">Enter a search term to find products</p>
          </div>
        )}
      </div>
    </div>
  )
}
