"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Grid3X3, List, ChevronDown, Truck, RotateCcw, Headphones, Shield } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getProductMainImage, handleImageError } from "@/lib/image-utils"

export default function OccasionsPage() {
  const [selectedOccasion, setSelectedOccasion] = useState("all")
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (data) {
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  const filteredProducts = products

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="bg-neutral-100 text-center py-2 text-xs font-medium">
        <span>FREE DELIVERY ON ORDERS OVER £100 • EASY RETURNS</span>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Page Title */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">ALL OCCASIONS</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
            Find the perfect outfit for every special moment. From Puja celebrations to Eid festivities, Christmas
            parties to wedding ceremonies, discover our curated collection designed to make you shine.
          </p>
        </div>

        {/* Product Controls */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center space-x-4">
            <Grid3X3 className="w-5 h-5" />
            <List className="w-5 h-5 text-gray-400" />
          </div>

          <div className="text-sm text-gray-600">{filteredProducts.length} PRODUCTS</div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 cursor-pointer">
              <span className="text-sm">SORT BY</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mb-12">
            {filteredProducts.map((product) => {
              const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

              return (
                <div key={product.id} className="group">
                  <Link href={`/products/${product.id}`}>
                    <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden cursor-pointer relative">
                      <Image
                        src={getProductMainImage(product)}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                      {hasDiscount && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-medium">
                          SALE
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="text-center">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-xs md:text-sm font-medium mb-1 hover:text-gray-600 cursor-pointer line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <p className="text-xs md:text-sm text-gray-900 font-medium">£{product.price}</p>
                      {product.compare_at_price && (
                        <p className="text-xs text-gray-400 line-through">£{product.compare_at_price}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available yet.</p>
          </div>
        )}

        {/* Service Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 py-12 md:py-16 border-t border-b">
          <div className="text-center">
            <Truck className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-4" />
            <h3 className="font-medium mb-2 text-sm">SUPER FAST DELIVERY</h3>
            <p className="text-xs text-gray-600">Orders placed by 2pm are shipped the same day for quick delivery.</p>
          </div>
          <div className="text-center">
            <RotateCcw className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-4" />
            <h3 className="font-medium mb-2 text-sm">EASY RETURNS</h3>
            <p className="text-xs text-gray-600">14 day return policy. Returns are free if you're not satisfied.</p>
          </div>
          <div className="text-center">
            <Headphones className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-4" />
            <h3 className="font-medium mb-2 text-sm">24/7 CLIENT CARE</h3>
            <p className="text-xs text-gray-600">Our team is available 24/7 to answer your questions.</p>
          </div>
          <div className="text-center">
            <Shield className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-4" />
            <h3 className="font-medium mb-2 text-sm">SECURE PAYMENTS</h3>
            <p className="text-xs text-gray-600">
              All payments are secured. We accept all major cards and digital wallets.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
