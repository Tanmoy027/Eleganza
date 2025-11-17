"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Truck, RotateCcw, Headphones, Shield } from "lucide-react"

import { getProductMainImage, handleImageError } from "@/lib/image-utils"
import PriceRangeFilter from "@/components/PriceRangeFilter"

export default function OccasionsPage() {
  const [selectedOccasion, setSelectedOccasion] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedClothingType, setSelectedClothingType] = useState("all")
  const [minPrice, setMinPrice] = useState(null)
  const [maxPrice, setMaxPrice] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 20

  useEffect(() => {
    let mounted = true

    async function fetchProducts() {
      try {
        const response = await fetch('/api/products', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        const result = await response.json()

        if (mounted && response.ok) {
          setProducts(result.data || [])
        } else {
          console.error("Error fetching products:", result.error)
          if (mounted) {
            setProducts([])
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        if (mounted) {
          setProducts([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      mounted = false
    }
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

  // Handle occasion change - reset category and clothing type when occasion changes
  const handleOccasionChange = (occasion) => {
    setSelectedOccasion(occasion)
    setSelectedCategory("all")
    setSelectedClothingType("all")
    setCurrentPage(1)
  }

  // Handle category change - reset clothing type when category changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedClothingType("all")
    setCurrentPage(1)
  }

  // Handle price range change
  const handlePriceChange = (min, max) => {
    setMinPrice(min)
    setMaxPrice(max)
    setCurrentPage(1)
  }

  // Filter products based on occasion, category, clothing type, and price range
  const filteredProducts = products.filter((product) => {
    // First filter by occasion
    const occasionMatch = selectedOccasion === "" || product.occasion?.toLowerCase() === selectedOccasion.toLowerCase()

    // Then filter by category
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

    return occasionMatch && categoryMatch && clothingTypeMatch && priceMatch
  })

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

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
          <h2 className="text-2xl md:text-3xl font-bold mb-4">ALL OCCASIONS</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
            Find the perfect outfit for every special moment. From Puja celebrations to Eid festivities, Christmas
            parties to wedding ceremonies, discover our curated collection designed to make you shine.
          </p>
        </div>

        {/* Occasion Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
          <button
            onClick={() => handleOccasionChange("")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            ALL OCCASIONS
          </button>
          <button
            onClick={() => handleOccasionChange("wedding")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "wedding" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            WEDDING
          </button>
          <button
            onClick={() => handleOccasionChange("party")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "party" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            PARTY
          </button>
          <button
            onClick={() => handleOccasionChange("casual")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "casual" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            CASUAL
          </button>
          <button
            onClick={() => handleOccasionChange("formal")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "formal" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            FORMAL
          </button>
          <button
            onClick={() => handleOccasionChange("traditional")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "traditional" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            TRADITIONAL
          </button>
          <button
            onClick={() => handleOccasionChange("puja")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "puja" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            PUJA
          </button>
          <button
            onClick={() => handleOccasionChange("eid")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "eid" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            EID
          </button>
          <button
            onClick={() => handleOccasionChange("christmas")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "christmas" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            CHRISTMAS
          </button>
          <button
            onClick={() => handleOccasionChange("sports")}
            className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedOccasion === "sports" ? "bg-black text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
              }`}
          >
            SPORTS
          </button>
        </div>

        {/* Category Filter Buttons - Show only when a specific occasion is selected */}
        {selectedOccasion !== "" && (
          <div className="mb-6 md:mb-8">
            <h3 className="text-center text-sm font-medium text-gray-700 mb-4 uppercase">
              {selectedOccasion} by Category
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleCategoryChange("all")}
                className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedCategory === "all" ? "bg-gray-700 text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
                  }`}
              >
                ALL
              </button>
              <button
                onClick={() => handleCategoryChange("women")}
                className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedCategory === "women" ? "bg-gray-700 text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
                  }`}
              >
                WOMEN
              </button>
              <button
                onClick={() => handleCategoryChange("men")}
                className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedCategory === "men" ? "bg-gray-700 text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
                  }`}
              >
                MEN
              </button>
              <button
                onClick={() => handleCategoryChange("child")}
                className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedCategory === "child" ? "bg-gray-700 text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
                  }`}
              >
                CHILD
              </button>
            </div>
          </div>
        )}

        {/* Clothing Type Filter Buttons - Show only when a specific category is selected */}
        {selectedOccasion !== "" && selectedCategory !== "all" && clothingTypes[selectedCategory] && (
          <div className="mb-6 md:mb-8">
            <h3 className="text-center text-sm font-medium text-gray-700 mb-4 uppercase">
              {selectedCategory} {selectedOccasion} Clothing Types
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedClothingType("all")}
                className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedClothingType === "all" ? "bg-gray-600 text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
                  }`}
              >
                ALL {selectedCategory.toUpperCase()}
              </button>
              {clothingTypes[selectedCategory].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedClothingType(type.value)}
                  className={`px-3 md:px-4 py-2 text-xs font-medium uppercase rounded transition-colors ${selectedClothingType === type.value ? "bg-gray-600 text-white" : "border border-gray-300 hover:bg-gray-50 bg-white text-gray-700"
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
          <div className="text-sm text-gray-600">
            {filteredProducts.length} PRODUCT{filteredProducts.length !== 1 ? 'S' : ''}
            {selectedOccasion !== "" && (
              <span className="ml-1 text-xs text-gray-500">
                • {selectedOccasion.toUpperCase()}
                {selectedCategory !== "all" && ` • ${selectedCategory.toUpperCase()}`}
                {selectedCategory !== "all" && selectedClothingType !== "all" && ` • ${clothingTypes[selectedCategory]?.find(t => t.value === selectedClothingType)?.label || selectedClothingType}`}
              </span>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mb-8">
              {paginatedProducts.map((product) => {
                const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
                const mainImage = getProductMainImage(product)

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
                            SALE
                          </div>
                        )}
                        {product.stock_quantity === 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-white text-black px-3 py-1 text-sm font-medium">Out of Stock</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1 uppercase">
                        {product.occasion && <span>{product.occasion}</span>}
                        {product.category && <span className="block">{product.category}</span>}
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
                        <p className="text-xs md:text-sm text-gray-900 font-medium">৳{product.price}</p>
                        {product.compare_at_price && (
                          <p className="text-xs text-gray-400 line-through">৳{product.compare_at_price}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm font-medium ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium ${currentPage === pageNum
                            ? 'bg-black text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      )
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2 py-2 text-gray-400">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm font-medium ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products available for this occasion.</p>
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
