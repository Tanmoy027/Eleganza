"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Truck, RotateCcw, Headphones, Shield, Tag } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getProductMainImage, handleImageError } from "@/lib/image-utils"
import PriceRangeFilter from "@/components/PriceRangeFilter"

export default function OffersPage() {
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [minPrice, setMinPrice] = useState(null)
    const [maxPrice, setMaxPrice] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProducts() {
            const supabase = getSupabaseBrowserClient()

            try {
                // Get all active products first
                const { data: allProducts, error: allError } = await supabase
                    .from("products")
                    .select("*")
                    .eq("is_active", true)

                console.log("[DEBUG] All active products:", allProducts)
                console.log("[DEBUG] All products error:", allError)

                if (allProducts) {
                    // Filter products that have any discount information
                    const discountedProducts = allProducts.filter(product => {
                        // Check multiple conditions for discounted products
                        return (
                            product.is_on_discount === true ||
                            (product.discount_price && product.discount_price > 0 && product.discount_price < product.price) ||
                            (product.discount_percentage && product.discount_percentage > 0) ||
                            (product.compare_at_price && product.compare_at_price > product.price)
                        )
                    }).sort((a, b) => {
                        // Sort by discount percentage if available, otherwise by price difference
                        const aDiscount = a.discount_percentage || 0
                        const bDiscount = b.discount_percentage || 0
                        return bDiscount - aDiscount
                    })

                    console.log("[DEBUG] Filtered discounted products:", discountedProducts)
                    setProducts(discountedProducts)
                } else {
                    console.log("[DEBUG] No products found")
                    setProducts([])
                }
            } catch (error) {
                console.error("[DEBUG] Error fetching products:", error)
                setProducts([])
            }
            setLoading(false)
        }

        fetchProducts()
    }, [])    // Handle price range change
    const handlePriceChange = (min, max) => {
        setMinPrice(min)
        setMaxPrice(max)
    }

    // Filter products by category and price range
    const filteredProducts = products.filter((product) => {
        // Filter by category
        const categoryMatch = selectedCategory === "all" || product.category?.toLowerCase() === selectedCategory

        // Filter by price range (use discount price if available, otherwise regular price)
        const price = product.discount_price && product.discount_price > 0 ? Number(product.discount_price) : Number(product.price)
        const priceMatch =
            (minPrice === null || price >= minPrice) &&
            (maxPrice === null || price <= maxPrice)

        return categoryMatch && priceMatch
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <p className="text-gray-500">Loading offers...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Top Banner */}
            <div className="bg-red-600 text-white text-center py-2 text-xs font-medium">
                <span>🔥 SPECIAL OFFERS • UP TO 70% OFF • LIMITED TIME ONLY 🔥</span>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {/* Page Title */}
                <div className="text-center mb-8 md:mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Tag className="w-6 h-6 text-red-500" />
                        <h2 className="text-2xl md:text-3xl font-bold">SPECIAL OFFERS</h2>
                        <Tag className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed">
                        Discover amazing deals on our premium collection. Limited time offers with discounts up to 70% off.
                        Don't miss out on these incredible savings!
                    </p>
                </div>

                {/* Category Filter Buttons */}
                <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className={`px-3 md:px-4 py-2 text-xs font-medium uppercase ${selectedCategory === "all"
                            ? "bg-red-500 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        ALL OFFERS
                    </button>
                    <button
                        onClick={() => setSelectedCategory("women")}
                        className={`px-3 md:px-4 py-2 text-xs font-medium uppercase ${selectedCategory === "women"
                            ? "bg-red-500 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        WOMEN
                    </button>
                    <button
                        onClick={() => setSelectedCategory("men")}
                        className={`px-3 md:px-4 py-2 text-xs font-medium uppercase ${selectedCategory === "men"
                            ? "bg-red-500 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        MEN
                    </button>
                    <button
                        onClick={() => setSelectedCategory("child")}
                        className={`px-3 md:px-4 py-2 text-xs font-medium uppercase ${selectedCategory === "child"
                            ? "bg-red-500 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                            }`}
                    >
                        CHILD
                    </button>                </div>

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
                        {filteredProducts.length} OFFER{filteredProducts.length !== 1 ? 'S' : ''}
                        {selectedCategory !== "all" && (
                            <span className="ml-1 text-xs text-gray-500">
                                • {selectedCategory.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mb-12">                        {filteredProducts.map((product) => {
                        // Check for discount in multiple ways
                        const hasNewDiscount = product.is_on_discount && product.discount_price && product.discount_percentage
                        const hasOldDiscount = product.compare_at_price && product.compare_at_price > product.price
                        const hasAnyDiscount = hasNewDiscount || hasOldDiscount

                        const mainImage = getProductMainImage(product)

                        // Calculate savings and discount percentage
                        let savings = 0
                        let discountPercentage = 0
                        let originalPrice = product.price
                        let discountPrice = product.price

                        if (hasNewDiscount) {
                            savings = (product.price - product.discount_price).toFixed(2)
                            discountPercentage = product.discount_percentage
                            originalPrice = product.price
                            discountPrice = product.discount_price
                        } else if (hasOldDiscount) {
                            savings = (product.compare_at_price - product.price).toFixed(2)
                            discountPercentage = Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                            originalPrice = product.compare_at_price
                            discountPrice = product.price
                        }

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
                                        />                                            {hasAnyDiscount && (
                                            <>
                                                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-bold rounded">
                                                    {discountPercentage}% OFF
                                                </div>                                                <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded">
                                                    SAVE ৳{savings}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </Link>
                                <div className="text-center">
                                    <div className="text-xs text-gray-500 mb-1 uppercase">
                                        {product.category}
                                    </div>
                                    <Link href={`/products/${product.id}`}>
                                        <h3 className="text-xs md:text-sm font-medium mb-2 hover:text-gray-600 cursor-pointer line-clamp-2">
                                            {product.name}
                                        </h3>
                                    </Link>                                    <div className="space-y-1">
                                        {hasAnyDiscount ? (
                                            <>                                                <div className="flex items-center justify-center space-x-2">
                                                <p className="text-sm md:text-base text-red-600 font-bold">৳{discountPrice}</p>
                                                <p className="text-xs text-gray-400 line-through">৳{originalPrice}</p>
                                            </div>
                                                <p className="text-xs text-green-600 font-medium">
                                                    You save ৳{savings} ({discountPercentage}% off)
                                                </p>
                                            </>) : (
                                            <p className="text-xs md:text-sm text-gray-900 font-medium">৳{product.price}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    </div>) : (
                    <div className="text-center py-12">
                        <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-2">No offers available right now</p>
                        <p className="text-gray-400 text-sm">
                            {products.length === 0
                                ? "No discount products found in database. Please run the SQL script or add discount products via admin panel."
                                : "Check back soon for amazing deals!"
                            }
                        </p>
                        <div className="mt-4 space-x-4">
                            <Link href="/clothing" className="inline-block px-6 py-2 bg-black text-white text-sm uppercase hover:bg-gray-800 transition-colors">
                                Shop All Products
                            </Link>
                            <Link href="/admin/products" className="inline-block px-6 py-2 border border-gray-300 text-gray-700 text-sm uppercase hover:bg-gray-50 transition-colors">
                                Add Discounts (Admin)
                            </Link>
                        </div>
                    </div>
                )}

                {/* Offer Features */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 py-12 md:py-16 border-t border-b bg-red-50">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                            <Tag className="w-6 h-6" />
                        </div>
                        <h3 className="font-medium mb-2 text-sm">HUGE SAVINGS</h3>
                        <p className="text-xs text-gray-600">Up to 70% off on selected items. Limited time offers.</p>
                    </div>
                    <div className="text-center">
                        <Truck className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-4" />
                        <h3 className="font-medium mb-2 text-sm">FREE DELIVERY</h3>
                        <p className="text-xs text-gray-600">Free shipping on all sale items over ৳50.</p>
                    </div>
                    <div className="text-center">
                        <RotateCcw className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-4" />
                        <h3 className="font-medium mb-2 text-sm">EASY RETURNS</h3>
                        <p className="text-xs text-gray-600">14 day return policy on all sale items.</p>
                    </div>
                    <div className="text-center">
                        <Shield className="w-6 md:w-8 h-6 md:h-8 mx-auto mb-4" />
                        <h3 className="font-medium mb-2 text-sm">SECURE PAYMENTS</h3>
                        <p className="text-xs text-gray-600">All payments are secured with SSL encryption.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
