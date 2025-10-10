"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import ProductCard from "./ProductCard"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function OccasionSection() {
  const [selectedOccasion, setSelectedOccasion] = useState("all")
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const occasions = [
    { id: "all", name: "All", icon: "✨" },
    { id: "puja", name: "Puja", icon: "🪔" },
    { id: "eid", name: "Eid", icon: "🌙" },
    { id: "christmas", name: "Christmas", icon: "🎄" },
    { id: "wedding", name: "Wedding", icon: "💐" },
  ]

  useEffect(() => {
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

  const displayProducts = products.slice(0, 4)

  return (
    <section className="py-12 md:py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-sm tracking-widest text-gray-600 mb-4">DRESS FOR EVERY CELEBRATION</p>
          <h2 className="text-2xl md:text-3xl font-light tracking-wide">SHOP BY OCCASION</h2>
        </div>

        {/* Occasion Tabs */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12">
          {occasions.map((occasion) => (
            <button
              key={occasion.id}
              onClick={() => setSelectedOccasion(occasion.id)}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium uppercase transition-all ${
                selectedOccasion === occasion.id
                  ? "bg-black text-white"
                  : "bg-white text-black border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="mr-2">{occasion.icon}</span>
              {occasion.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available yet.</p>
          </div>
        )}

        <div className="text-center mt-8 md:mt-12">
          <Link
            href="/occasions"
            className="inline-block bg-black text-white uppercase text-xs md:text-sm font-medium py-3 px-8 md:px-12 hover:bg-gray-800 transition-colors"
          >
            VIEW ALL OCCASIONS
          </Link>
        </div>
      </div>
    </section>
  )
}
