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
import { getProductVariants, buildAvailabilityMaps } from "@/lib/inventory"

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
  const [variants, setVariants] = useState([])
  const [availability, setAvailability] = useState({ byColor: new Map(), bySize: new Map(), byKey: new Map() })

  // Get all valid images for the gallery
  const productImages = getProductImages(product)

  useEffect(() => {
    let mounted = true
    async function checkWishlist() {
      const isInList = await isInWishlist(product.id)
      if (mounted) {
        setInWishlist(isInList)
      }
    }
    checkWishlist()

    return () => {
      mounted = false
    }
  }, [product.id])

  // Derive unique colors and sizes from variants
  const uniqueColors = [...new Set(variants.map(v => v.color).filter(Boolean))]
  const uniqueSizes = [...new Set(variants.map(v => v.size).filter(Boolean))]

  useEffect(() => {
    let mounted = true
    async function loadVariants() {
      const { data } = await getProductVariants(product.id)
      if (!mounted) return

      setVariants(data || [])
      const m = buildAvailabilityMaps(data || [])
      setAvailability(m)

      // Get actual sizes and colors from variants
      const actualSizes = [...new Set((data || []).map(v => v.size).filter(Boolean))]
      const actualColors = [...new Set((data || []).map(v => v.color).filter(Boolean))]

      // Fallback to product.sizes/colors if no variants exist
      const sizes = actualSizes.length > 0 ? actualSizes : (product.sizes && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'])
      const colors = actualColors.length > 0 ? actualColors : (product.colors || [])

      // Auto-select: prefer size L if available else first size
      let defaultSize = sizes.includes('L') ? 'L' : sizes[0]

      // Ensure defaultSize has at least one color available if colors exist
      if (colors.length > 0) {
        const availableColor = colors.find(c => variantInStockInternal(c, defaultSize, m))
        if (!availableColor) {
          // pick first size that has any available color
          const sizeWithStock = sizes.find(sz => colors.some(c => variantInStockInternal(c, sz, m)))
          if (sizeWithStock) defaultSize = sizeWithStock
        }
      }

      if (!mounted) return
      setSelectedSize(defaultSize || "")

      if (colors.length > 0) {
        const firstAvailableColor = colors.find(c => variantInStockInternal(c, defaultSize, m)) || colors[0]
        if (!mounted) return
        setSelectedColor(firstAvailableColor || "")
      }
    }
    loadVariants()

    return () => {
      mounted = false
    }
  }, [product.id])

  const variantInStockInternal = (color, size, maps = availability) => {
    const key = `${(color || '').toLowerCase()}__${(size || '').toUpperCase()}`
    const v = maps.byKey.get(key)
    return !!v && (v.stock_quantity || 0) > 0
  }

  const variantInStock = (color, size) => variantInStockInternal(color, size, availability)

  // Get stock quantity for a specific variant
  const getVariantStock = (color, size) => {
    const key = `${(color || '').toLowerCase()}__${(size || '').toUpperCase()}`
    const v = availability.byKey.get(key)
    return v ? (v.stock_quantity || 0) : 0
  }

  const overallInStock = () => {
    if (variants.length > 0) {
      return variants.some(v => (v.stock_quantity || 0) > 0)
    }
    return (product.stock_quantity || 0) > 0
  }

  // When selecting size, keep color if still available else clear
  const onSelectSize = (size) => {
    setSelectedSize(size)
    const colors = uniqueColors.length > 0 ? uniqueColors : (product.colors || [])
    if (colors.length > 0) {
      if (!variantInStock(selectedColor, size)) {
        const next = colors.find(c => variantInStock(c, size)) || ""
        setSelectedColor(next)
      }
    }
  }

  // When selecting color, keep size if still available else clear
  const onSelectColor = (color) => {
    setSelectedColor(color)
    const sizes = uniqueSizes.length > 0 ? uniqueSizes : (product.sizes && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL', 'XXL'])
    if (selectedSize && !variantInStock(color, selectedSize)) {
      const next = sizes.find(sz => variantInStock(color, sz)) || ""
      setSelectedSize(next)
    }
  }

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
    const colors = uniqueColors.length > 0 ? uniqueColors : (product.colors || [])
    if (colors.length > 0 && !selectedColor) {
      alert("⚠️ Please select a color before adding to cart")
      return
    }

    setLoading(true)
    try {
      const { error } = await addToCart(
        product.id,
        1,
        selectedSize,
        selectedColor
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
              {!overallInStock() && (
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
              <div className="flex gap-3 flex-wrap">
                {(uniqueSizes.length > 0 ? uniqueSizes : (product.sizes || ['S', 'M', 'L', 'XL', 'XXL'])).map((size) => {
                  // Check if this size has any stock in any color
                  let available = false
                  if (selectedColor) {
                    available = variantInStock(selectedColor, size)
                  } else if (variants.length > 0) {
                    // Check if any variant with this size has stock
                    const colors = uniqueColors.length > 0 ? uniqueColors : (product.colors || [])
                    available = colors.some(c => variantInStock(c, size))
                  } else {
                    available = (product.stock_quantity || 0) > 0
                  }

                  // Get stock for this size (sum across all colors if no color selected, or specific color if selected)
                  let stockCount = 0
                  if (selectedColor) {
                    stockCount = getVariantStock(selectedColor, size)
                  } else if (variants.length > 0) {
                    const colors = uniqueColors.length > 0 ? uniqueColors : (product.colors || [])
                    stockCount = colors.reduce((sum, c) => sum + getVariantStock(c, size), 0)
                  } else {
                    stockCount = product.stock_quantity || 0
                  }

                  return (
                    <button
                      key={size}
                      onClick={() => onSelectSize(size)}
                      disabled={!available}
                      className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-all relative ${selectedSize === size
                        ? "bg-black text-white border-black"
                        : available ? "bg-white text-gray-700 border-gray-300 hover:border-gray-400" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{size}</span>
                        {stockCount > 0 && (
                          <span className={`text-xs ${selectedSize === size ? 'text-gray-300' : 'text-gray-500'}`}>
                            {stockCount} left
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Color Selection */}
            {(uniqueColors.length > 0 || (product.colors && product.colors.length > 0)) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Select Color</span>
                  <span className="text-red-500 text-sm">*</span>
                  {!selectedColor && <span className="text-xs text-gray-500">(Required)</span>}
                </div>
                <div className="flex gap-3 flex-wrap">
                  {(uniqueColors.length > 0 ? uniqueColors : product.colors).map((color) => {
                    // Check if this color has any stock in any size
                    let available = false
                    if (selectedSize) {
                      available = variantInStock(color, selectedSize)
                    } else if (variants.length > 0) {
                      // Check if any variant with this color has stock
                      const sizes = uniqueSizes.length > 0 ? uniqueSizes : (product.sizes || ['S', 'M', 'L', 'XL', 'XXL'])
                      available = sizes.some(s => variantInStock(color, s))
                    } else {
                      available = (product.stock_quantity || 0) > 0
                    }

                    // Get stock for this color (sum across all sizes if no size selected, or specific size if selected)
                    let stockCount = 0
                    if (selectedSize) {
                      stockCount = getVariantStock(color, selectedSize)
                    } else if (variants.length > 0) {
                      const sizes = uniqueSizes.length > 0 ? uniqueSizes : (product.sizes || ['S', 'M', 'L', 'XL', 'XXL'])
                      stockCount = sizes.reduce((sum, s) => sum + getVariantStock(color, s), 0)
                    } else {
                      stockCount = product.stock_quantity || 0
                    }

                    return (
                      <button
                        key={color}
                        onClick={() => onSelectColor(color)}
                        disabled={!available}
                        className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-all capitalize relative ${selectedColor === color
                          ? "bg-black text-white border-black"
                          : available ? "bg-white text-gray-700 border-gray-300 hover:border-gray-400" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          }`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{color}</span>
                          {stockCount > 0 && (
                            <span className={`text-xs ${selectedColor === color ? 'text-gray-300' : 'text-gray-500'}`}>
                              {stockCount} left
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {selectedColor && selectedSize && (
                  <div className="text-sm bg-gray-50 p-3 rounded-lg border">
                    {variantInStock(selectedColor, selectedSize) ? (
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-medium">✓ Available</span>
                        <span className="text-gray-600">
                          <strong>{getVariantStock(selectedColor, selectedSize)}</strong> in stock
                        </span>
                      </div>
                    ) : (
                      <span className="text-red-600 font-medium">✗ Not available in this combination</span>
                    )}
                  </div>
                )}
                {(selectedColor || selectedSize) && !(selectedColor && selectedSize) && (
                  <div className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 font-medium">Current Selection</span>
                      <span className="text-gray-600">
                        {selectedColor && !selectedSize && (
                          <span><strong>{uniqueSizes.length > 0 ? uniqueSizes.reduce((sum, s) => sum + getVariantStock(selectedColor, s), 0) : product.stock_quantity || 0}</strong> total for {selectedColor}</span>
                        )}
                        {selectedSize && !selectedColor && (
                          <span><strong>{uniqueColors.length > 0 ? uniqueColors.reduce((sum, c) => sum + getVariantStock(c, selectedSize), 0) : product.stock_quantity || 0}</strong> total for {selectedSize}</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-black text-white hover:bg-gray-800 py-3 px-6 rounded-full font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={loading || !overallInStock() || !selectedSize || ((uniqueColors.length > 0 || (product.colors && product.colors.length > 0)) && !selectedColor) || (selectedColor && selectedSize && !variantInStock(selectedColor, selectedSize))}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </div>
                  ) : !overallInStock() ? (
                    "Out of Stock"
                  ) : !selectedSize ? (
                    "Select Size"
                  ) : ((uniqueColors.length > 0 || (product.colors && product.colors.length > 0)) && !selectedColor) ? (
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
