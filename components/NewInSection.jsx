"use client"

import { useState, useEffect } from "react"
import ProductCard from "./ProductCard"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function NewInSection() {
  const [filter, setFilter] = useState("all")
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(null)

  useEffect(() => {
    setCurrentTime(Date.now()) // Set current time only on client side

    async function fetchProducts() {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8)

      if (data) {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  const filteredProducts = products.filter((product) => {
    if (filter === "all") return true
    if (filter === "new") {
      if (!currentTime) return true // Show all products during initial render
      return new Date(product.created_at) > new Date(currentTime - 30 * 24 * 60 * 60 * 1000)
    }
    if (filter === "offers") return product.compare_at_price && product.compare_at_price > product.price
    return true
  })

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Loading products...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-sm tracking-widest text-gray-600 mb-4">DISCOVER THE NEW SEASON</p>
          <h2 className="text-2xl md:text-3xl font-light tracking-wide">SHOP NEW IN</h2>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-10">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 md:px-5 py-2 text-xs md:text-sm font-medium uppercase transition-all ${filter === "all" ? "bg-black text-white" : "bg-white text-black border border-gray-300 hover:bg-gray-50"
              }`}
          >
            ALL
          </button>
          <button
            onClick={() => setFilter("new")}
            className={`px-4 md:px-5 py-2 text-xs md:text-sm font-medium uppercase transition-all ${filter === "new" ? "bg-black text-white" : "bg-white text-black border border-gray-300 hover:bg-gray-50"
              }`}
          >
            NEW ARRIVALS
          </button>
          <button
            onClick={() => setFilter("offers")}
            className={`px-4 md:px-5 py-2 text-xs md:text-sm font-medium uppercase transition-all ${filter === "offers"
                ? "bg-black text-white"
                : "bg-white text-black border border-gray-300 hover:bg-gray-50"
              }`}
          >
            SPECIAL OFFERS
          </button>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}
