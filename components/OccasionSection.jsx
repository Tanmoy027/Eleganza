"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import ProductCard from "./ProductCard"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function OccasionSection() {
  const [selectedOccasion, setSelectedOccasion] = useState("all")
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const occasions = [
    {
      id: "all",
      name: "All Occasions",
      icon: "✨",
      image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Perfect for every celebration"
    },
    {
      id: "wedding",
      name: "Wedding",
      icon: "💐",
      image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Elegant wedding guest attire"
    },
    {
      id: "party",
      name: "Party",
      icon: "🎉",
      image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Stunning party outfits"
    },
    {
      id: "formal",
      name: "Formal",
      icon: "👔",
      image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Professional & formal wear"
    },
    {
      id: "casual",
      name: "Casual",
      icon: "👕",
      image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Comfortable everyday styles"
    },
    {
      id: "festival",
      name: "Festival",
      icon: "🎊",
      image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=600",
      description: "Traditional festival outfits"
    },
  ]

  useEffect(() => {
    async function fetchProducts() {
      const supabase = getSupabaseBrowserClient()
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (selectedOccasion !== "all") {
        query = query.eq("occasion", selectedOccasion)
      }

      const { data } = await query.limit(8)

      if (data) {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [selectedOccasion])

  const displayProducts = products.slice(0, 4)

  return (
    <section id="occasions" className="py-12 md:py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-sm tracking-widest text-gray-600 mb-4">DRESS FOR EVERY CELEBRATION</p>
          <h2 className="text-2xl md:text-3xl font-light tracking-wide">SHOP BY OCCASION</h2>
        </div>

        {/* Occasion Banner Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 md:mb-12">
          {occasions.map((occasion) => (
            <div
              key={occasion.id}
              onClick={() => setSelectedOccasion(occasion.id)}
              className={`relative h-40 md:h-48 group cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ${selectedOccasion === occasion.id
                ? "ring-4 ring-black shadow-xl scale-105"
                : "hover:scale-102 hover:shadow-lg"
                }`}
            >
              <Image
                src={occasion.image}
                alt={occasion.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div className="flex items-center justify-center mb-1">
                  <span className="text-xl mr-1">{occasion.icon}</span>
                  <h3 className="text-sm md:text-base font-semibold tracking-wide">{occasion.name}</h3>
                </div>
                <p className="text-xs text-center opacity-90">{occasion.description}</p>
              </div>
              {selectedOccasion === occasion.id && (
                <div className="absolute top-2 right-2">
                  <div className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <span className="text-xs">✓</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Occasion Tabs */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12">
          {occasions.map((occasion) => (
            <button
              key={occasion.id}
              onClick={() => setSelectedOccasion(occasion.id)}
              className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium uppercase transition-all rounded-full ${selectedOccasion === occasion.id
                ? "bg-black text-white shadow-lg"
                : "bg-white text-black border border-gray-300 hover:bg-gray-50 hover:shadow-md"
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-gray-500 mt-4">Loading occasion products...</p>
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available for {selectedOccasion === "all" ? "this collection" : `${selectedOccasion} occasions`}.</p>
          </div>
        )}

        <div className="text-center mt-8 md:mt-12">
          <Link
            href={selectedOccasion === "all" ? "/products" : `/products?occasion=${selectedOccasion}`}
            className="inline-block bg-black text-white uppercase text-xs md:text-sm font-medium py-3 px-8 md:px-12 hover:bg-gray-800 transition-colors rounded-full shadow-lg hover:shadow-xl"
          >
            VIEW ALL {selectedOccasion === "all" ? "OCCASIONS" : `${selectedOccasion.toUpperCase()} COLLECTION`}
          </Link>
        </div>
      </div>
    </section>
  )
}
