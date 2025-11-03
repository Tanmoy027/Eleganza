"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ProductCard } from "@/components/products/product-card"
import PriceRangeFilter from "@/components/PriceRangeFilter"

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [minPrice, setMinPrice] = useState(null)
  const [maxPrice, setMaxPrice] = useState(null)

  // Get URL parameters
  const category = searchParams.get('category')
  const clothing_type = searchParams.get('clothing_type')
  const occasion = searchParams.get('occasion')
  const season = searchParams.get('season')

  useEffect(() => {
    async function fetchProducts() {
      const supabase = getSupabaseBrowserClient()
      let query = supabase.from("products").select("*").eq("is_active", true)

      if (category) {
        query = query.eq("category", category)
      }
      if (clothing_type) {
        query = query.eq("clothing_type", clothing_type)
      }
      if (occasion) {
        query = query.eq("occasion", occasion)
      }
      if (season) {
        query = query.eq("season", season)
      }

      const { data } = await query.order("created_at", { ascending: false })
      if (data) {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [category, clothing_type, occasion, season])

  // Handle price range change
  const handlePriceChange = (min, max) => {
    setMinPrice(min)
    setMaxPrice(max)
  }

  // Filter products by price range
  const filteredProducts = products.filter((product) => {
    const price = Number(product.price)
    const priceMatch =
      (minPrice === null || price >= minPrice) &&
      (maxPrice === null || price <= maxPrice)
    return priceMatch
  })

  // Determine the page title and description based on filters
  let pageTitle = "Products"
  let pageDescription = "Browse our collection"

  if (season) {
    pageTitle = `${season.charAt(0).toUpperCase() + season.slice(1)} Collection`
    pageDescription = `Discover our ${season} seasonal collection`
  } else if (occasion) {
    pageTitle = `${occasion.charAt(0).toUpperCase() + occasion.slice(1)} Collection`
    pageDescription = `Perfect outfits for ${occasion} occasions`
  } else if (category) {
    pageTitle = `${category.charAt(0).toUpperCase() + category.slice(1)}`
    pageDescription = `Browse our ${category} collection`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-4">{pageTitle}</h1>
          <p className="text-gray-600 text-sm tracking-widest uppercase">{pageDescription}</p>

          {/* Active Filters Display */}
          {(season || occasion || category || clothing_type) && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-gray-500">Filtered by:</span>
              {season && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Season: {season}
                </span>
              )}
              {occasion && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Occasion: {occasion}
                </span>
              )}
              {category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Category: {category}
                </span>
              )}
              {clothing_type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Type: {clothing_type}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="flex justify-center mb-6 md:mb-8">
          <PriceRangeFilter
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
          />
        </div>
      </div>

      {/* Products Section */}
      {filteredProducts && filteredProducts.length > 0 ? (
        <div className="flex-1 flex justify-center">
          <div className="container mx-auto px-4 pb-12 max-w-7xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center container mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {season || occasion || category || clothing_type
                ? "Try adjusting your filters or browse all products."
                : "Check back later for new arrivals."}
            </p>
            <a
              href="/products"
              className="inline-block bg-black text-white text-sm font-medium py-2 px-6 rounded-full hover:bg-gray-800 transition-colors"
            >
              Browse All Products
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
