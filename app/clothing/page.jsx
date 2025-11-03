"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Truck, RotateCcw, Headphones, Shield } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getProductMainImage, handleImageError } from "@/lib/image-utils"
import PriceRangeFilter from "@/components/PriceRangeFilter"

export default function ClothingPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedClothingType, setSelectedClothingType] = useState("all")
  const [minPrice, setMinPrice] = useState(null)
  const [maxPrice, setMaxPrice] = useState(null)
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
        console.log("[v0] Clothing page - Fetched products:", data)
        setProducts(data)
      }
      setLoading(false)
    }

    fetchProducts()
  }, [])

  // Clothing types based on category (matching the product form structure)
  const clothingTypes = {
    men: [
      { value: 'formal-shirt', label: 'Formal Shirt' },
      { value: 'casual-shirt', label: 'Casual Shirt' },
      { value: 'panjabi-kurta', label: 'Panjabi (Kurta)' },
      { value: 't-shirts', label: 'T-Shirts' },
      { value: 'polo-shirts', label: 'Polo Shirts' },
      { value: 'pants', label: 'Pants' },
      { value: 'trousers', label: 'Trousers' },
      { value: 'jeans', label: 'Jeans' },
      { value: 'denim', label: 'Denim' },
      { value: 'mens-loungewear', label: 'Loungewear' },
      { value: 'sleepwear', label: 'Sleepwear' },
      { value: 'jacket', label: 'Jacket' },
      { value: 'coat', label: 'Coat' },
      { value: 'sweater', label: 'Sweater' },
      { value: 'ethnic-outfits', label: 'Ethnic Outfits' },
      { value: 'formal-suits', label: 'Formal Suits' },
      { value: 'blazers', label: 'Blazers' }
    ],
    women: [
      { value: 'saree', label: 'Saree' },
      { value: 'salwar-kameez', label: 'Salwar-Kameez' },
      { value: 'kurti', label: 'Kurti' },
      { value: 'kurtas', label: 'Kurtas' },
      { value: 'tops', label: 'Tops' },
      { value: 'blouses', label: 'Blouses' },
      { value: 'maxi-dresses', label: 'Maxi Dresses' },
      { value: 'gowns', label: 'Gowns' },
      { value: 'skirts', label: 'Skirts' },
      { value: 'palazzos', label: 'Palazzos' },
      { value: 'nightwear', label: 'Nightwear' },
      { value: 'loungewear', label: 'Loungewear' },
      { value: 'hijab', label: 'Hijab' },
      { value: 'dupatta', label: 'Dupatta' },
      { value: 'scarves', label: 'Scarves' },
      { value: 'unstitched-cloth', label: 'Unstitched Cloth' },
      { value: 'western-wear-jackets', label: 'Western Wear Jackets' },
      { value: 'jumpsuits', label: 'Jumpsuits' }
    ],
    child: [
      { value: 'boys-shirts', label: 'Boys Shirts' },
      { value: 'girls-tops', label: 'Girls Tops' },
      { value: 'kids-t-shirts', label: 'Kids T-Shirts' },
      { value: 'boys-pants', label: 'Boys Pants' },
      { value: 'girls-dresses', label: 'Girls Dresses' },
      { value: 'kids-shorts', label: 'Kids Shorts' },
      { value: 'school-uniforms', label: 'School Uniforms' },
      { value: 'kids-ethnic-wear', label: 'Kids Ethnic Wear' },
      { value: 'baby-rompers', label: 'Baby Rompers' },
      { value: 'kids-sleepwear', label: 'Kids Sleepwear' },
      { value: 'kids-jackets', label: 'Kids Jackets' },
      { value: 'kids-traditional', label: 'Kids Traditional' },
      { value: 'kids-casual', label: 'Kids Casual' },
      { value: 'kids-formal', label: 'Kids Formal' }
    ]
  }

  // Handle category change - reset clothing type when category changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedClothingType("all") // Reset clothing type when category changes
  }

  // Handle price range change
  const handlePriceChange = (min, max) => {
    setMinPrice(min)
    setMaxPrice(max)
  }

  // Filter products based on category, clothing type, and price range
  const filteredProducts = products.filter((product) => {
    // First filter by category
    const categoryMatch = selectedCategory === "all" || product.category?.toLowerCase() === selectedCategory

    // Then filter by clothing type if a specific category is selected and clothing type is not "all"
    const clothingTypeMatch = selectedCategory === "all" ||
      selectedClothingType === "all" ||
      product.clothing_type === selectedClothingType

    // Filter by price range
    const price = Number(product.price)
    const priceMatch =
      (minPrice === null || price >= minPrice) &&
      (maxPrice === null || price <= maxPrice)

    return categoryMatch && clothingTypeMatch && priceMatch
  })

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
        <span>FREE DELIVERY ON ORDERS OVER ৳100 • EASY RETURNS</span>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Page Title */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">ALL CLOTHING</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
            Discover our complete clothing collection for women, men, and children. From sophisticated separates to
            statement pieces and wardrobe essentials, find the perfect style for everyone.
          </p>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedCategory === "all" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            ALL CLOTHING
          </button>
          <button
            onClick={() => handleCategoryChange("women")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedCategory === "women" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            WOMEN
          </button>
          <button
            onClick={() => handleCategoryChange("men")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedCategory === "men" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            MEN
          </button>
          <button
            onClick={() => handleCategoryChange("child")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedCategory === "child" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            CHILD
          </button>
        </div>

        {/* Clothing Type Filter Buttons - Show only when a specific category is selected */}
        {selectedCategory !== "all" && clothingTypes[selectedCategory] && (
          <div className="mb-6 md:mb-8">
            <h3 className="text-center text-sm font-medium text-gray-700 mb-4 uppercase">
              {selectedCategory} Clothing Types
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedClothingType("all")}
                className={`px-3 md:px-4 py-2 text-xs font-medium uppercase ${selectedClothingType === "all" ? "bg-gray-700 text-white" : "border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                ALL {selectedCategory.toUpperCase()}
              </button>
              {clothingTypes[selectedCategory].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedClothingType(type.value)}
                  className={`px-3 md:px-4 py-2 text-xs font-medium uppercase ${selectedClothingType === type.value ? "bg-gray-700 text-white" : "border border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Range Filter */}
        <div className="flex justify-center mb-6 md:mb-8">
          <PriceRangeFilter
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
          />
        </div>

        {/* Product Controls */}
        <div className="flex items-center justify-center mb-6 md:mb-8">
          {/* Removed grid/list icons and sort by UI */}

          <div className="text-sm text-gray-600">
            {filteredProducts.length} PRODUCT{filteredProducts.length !== 1 ? 'S' : ''}
            {selectedCategory !== "all" && (
              <span className="ml-1 text-xs text-gray-500">
                • {selectedCategory.toUpperCase()}
                {selectedClothingType !== "all" && ` • ${clothingTypes[selectedCategory]?.find(t => t.value === selectedClothingType)?.label || selectedClothingType}`}
              </span>
            )}
            {(minPrice !== null || maxPrice !== null) && (
              <span className="ml-1 text-xs text-gray-500">
                • {minPrice !== null && maxPrice !== null
                  ? `৳${minPrice} - ৳${maxPrice}`
                  : minPrice !== null
                    ? `৳${minPrice}+`
                    : `Up to ৳${maxPrice}`}
              </span>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mb-12">
            {filteredProducts.map((product) => {
              const hasDiscount = product.is_on_discount && product.discount_price && product.discount_percentage
              const mainImage = getProductMainImage(product)
              const savings = hasDiscount ? (product.price - product.discount_price).toFixed(2) : 0

              return (
                <div key={product.id} className="group">
                  <Link href={`/products/${product.id}`}>
                    <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden cursor-pointer relative">
                      <Image
                        src={mainImage || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                      {hasDiscount && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-medium">
                          {product.discount_percentage}% OFF
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1 uppercase">
                      {product.category}
                      {product.clothing_type && selectedCategory !== "all" && (
                        <span className="block text-gray-400 font-light">
                          {clothingTypes[product.category]?.find(t => t.value === product.clothing_type)?.label || product.clothing_type}
                        </span>
                      )}
                    </div>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="text-xs md:text-sm font-medium mb-1 hover:text-gray-600 cursor-pointer line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      {hasDiscount ? (
                        <>
                          <p className="text-xs md:text-sm text-red-600 font-bold">৳{product.discount_price}</p>
                          <p className="text-xs text-gray-400 line-through">৳{product.price}</p>
                        </>
                      ) : (
                        <p className="text-xs md:text-sm text-gray-900 font-medium">৳{product.price}</p>
                      )}
                    </div>
                    {hasDiscount && (
                      <p className="text-xs text-green-600 font-medium">
                        Save ৳{savings} ({product.discount_percentage}% off)
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available in this category.</p>
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
