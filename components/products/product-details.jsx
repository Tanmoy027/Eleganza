"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Heart, ChevronDown, Truck, Package, Shield, Clock } from "lucide-react"
import { addToCart } from "@/lib/cart"
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist"
import { getProductMainImage, getProductImages, handleImageError as handleImgError } from "@/lib/image-utils"
import { ProductReviews } from "@/components/ProductReviews"
import { ProductCard } from "./product-card"

export function ProductDetails({ product, similarProducts = [] }) {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(getProductMainImage(product))
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showShipping, setShowShipping] = useState(false)

  // Get all valid images for the gallery
  const productImages = getProductImages(product)

  useEffect(() => {
    async function checkWishlist() {
      const isInList = await isInWishlist(product.id)
      setInWishlist(isInList)
    }
    checkWishlist()
  }, [product.id])

  // Handle image load error
  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true)
      setSelectedImage("/placeholder.svg")
      handleImgError(e)
    }
  }

  const handleAddToCart = async () => {
    // Validate size selection
    if (!selectedSize) {
      alert("⚠️ Please select a size before adding to cart")
      return
    }

    // Check if product has colors and none selected
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("⚠️ Please select a color before adding to cart")
      return
    }

    setLoading(true)
    try {
      const { error } = await addToCart(
        product.id,
        1,
        selectedSize,
        selectedColor || "default"
      )

      if (error) {
        alert("❌ Error adding to cart: " + error.message)
      } else {
        alert("✅ Added to cart successfully!")
        router.refresh()
      }
    } catch (error) {
      console.error("Cart error:", error)
      alert("🔐 Please login to add items to cart")
      router.push("/login")
    }
    setLoading(false)
  }

  const handleWishlistToggle = async () => {
    setWishlistLoading(true)
    try {
      if (inWishlist) {
        const { error } = await removeFromWishlist(product.id)
        if (error) {
          alert("Error removing from wishlist: " + error.message)
        } else {
          setInWishlist(false)
          router.refresh()
        }
      } else {
        const { error } = await addToWishlist(product.id)
        if (error) {
          alert("Error adding to wishlist: " + error.message)
        } else {
          setInWishlist(true)
          router.refresh()
        }
      }
    } catch (error) {
      alert("Please login to manage wishlist")
      router.push("/login")
    }
    setWishlistLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="flex items-center gap-2 text-sm hover:text-black">
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-600">Product details</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Product Image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm">
              <Image
                src={selectedImage || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
                priority
                onError={handleImageError}
              />
              {product.stock_quantity === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg">
                    Out of Stock
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex gap-3 justify-start">
              {productImages.slice(0, 3).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`relative w-20 h-20 overflow-hidden rounded-lg border-2 transition-all bg-white ${selectedImage === image ? "border-black" : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                    onError={handleImgError}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand/Category */}
            <div className="text-sm text-gray-500 uppercase tracking-wide">
              {product.category || "Man Fashion"}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-normal mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-4">
              {product.is_on_discount && product.discount_price && product.discount_percentage ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-semibold text-red-600">
                      ৳{Number(product.discount_price).toFixed(2)}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      ৳{Number(product.price).toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                      {product.discount_percentage}% OFF
                    </span>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    You save ৳{(product.price - product.discount_price).toFixed(2)} ({product.discount_percentage}% off)
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-semibold">
                  ৳{Number(product.price).toFixed(2)}
                </div>
              )}
            </div>

            {/* Stock Status with Clock Icon */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <Clock className="w-4 h-4" />
              <span>Order in <span className="text-orange-500 font-medium">02:30:05</span> to get next day delivery</span>
            </div>

            {/* Size Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Select Size</span>
                <span className="text-red-500 text-sm">*</span>
                {!selectedSize && <span className="text-xs text-gray-500">(Required)</span>}
              </div>
              <div className="flex gap-3">
                {(product.sizes || ['S', 'M', 'L', 'XL', 'XXL']).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-all ${selectedSize === size
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Select Color</span>
                  <span className="text-red-500 text-sm">*</span>
                  {!selectedColor && <span className="text-xs text-gray-500">(Required)</span>}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-all capitalize ${selectedColor === color
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-black text-white hover:bg-gray-800 py-3 px-6 rounded-full font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={loading || product.stock_quantity === 0 || !selectedSize || (product.colors && product.colors.length > 0 && !selectedColor)}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </div>
                  ) : product.stock_quantity === 0 ? (
                    "Out of Stock"
                  ) : !selectedSize ? (
                    "Select Size"
                  ) : (product.colors && product.colors.length > 0 && !selectedColor) ? (
                    "Select Color"
                  ) : (
                    "Add to Cart"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-gray-300 w-12 h-12 flex-shrink-0"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Description & Fit */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center justify-between w-full text-left py-4 hover:bg-gray-50 -mx-2 px-2 rounded"
              >
                <span className="font-medium text-gray-900">Description & Fit</span>
                <ChevronDown className={`w-5 h-5 transform transition-transform text-gray-400 ${showDescription ? 'rotate-180' : ''}`} />
              </button>
              {showDescription && (
                <div className="pb-6 text-sm text-gray-600 leading-relaxed">
                  <p className="mb-3">{product.description}</p>
                  <p>Loose-fit sweatshirt hoodie in medium-weight cotton-blend fabric with a generous, but not oversized silhouette. Jersey-lined, drawstring hood, dropped shoulder seams and a kangaroo pocket. Wide ribbing at cuffs and hem. Soft, brushed inside.</p>
                </div>
              )}
            </div>

            {/* Shipping */}
            <div className="border-t border-gray-200">
              <button
                onClick={() => setShowShipping(!showShipping)}
                className="flex items-center justify-between w-full text-left py-4 hover:bg-gray-50 -mx-2 px-2 rounded"
              >
                <span className="font-medium text-gray-900">Shipping</span>
                <ChevronDown className={`w-5 h-5 transform transition-transform text-gray-400 ${showShipping ? 'rotate-180' : ''}`} />
              </button>
              {showShipping && (
                <div className="pb-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Free 90%</div>
                      <div className="text-sm text-gray-500">Popular Package</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Delivery from</div>
                      <div className="text-sm text-gray-500">3-4 Working Days</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Estimated Arrival</div>
                      <div className="text-sm text-gray-500">10 - 12 October 2024</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 max-w-7xl mx-auto">
          <ProductReviews productId={product.id} />
        </div>

        {/* You might also like */}
        {similarProducts.length > 0 && (
          <div className="mt-20 max-w-7xl mx-auto">
            <h2 className="text-3xl font-normal text-center mb-12">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {similarProducts.map((similarProduct) => (
                <div key={similarProduct.id} className="group">
                  <Link href={`/product/${similarProduct.id}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <Image
                          src={getProductMainImage(similarProduct)}
                          alt={similarProduct.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={handleImgError}
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="font-medium text-base mb-3 line-clamp-2 group-hover:text-gray-600 transition-colors">
                          {similarProduct.name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-semibold">৳{Number(similarProduct.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
