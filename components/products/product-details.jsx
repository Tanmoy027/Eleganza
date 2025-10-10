"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react"
import { addToCart } from "@/lib/cart"
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist"
import { getProductMainImage, getProductImages, handleImageError as handleImgError } from "@/lib/image-utils"

export function ProductDetails({ product }) {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(getProductMainImage(product))
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

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
    if (!selectedSize || !selectedColor) {
      alert("Please select size and color")
      return
    }

    setLoading(true)
    try {
      const { error } = await addToCart(product.id, quantity, selectedSize, selectedColor)
      if (error) {
        alert("Error adding to cart: " + error.message)
      } else {
        alert("Added to cart successfully!")
        router.refresh()
      }
    } catch (error) {
      alert("Please login to add items to cart")
      router.push("/login")
    }
    setLoading(false)
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    router.push("/cart")
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
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border">
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
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${selectedImage === image ? "border-primary" : "border-transparent hover:border-gray-300"
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
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary" className="capitalize">
                {product.category}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {product.occasion}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {product.season}
              </Badge>
            </div>
            <p className="text-3xl font-bold text-primary">${Number(product.price).toFixed(2)}</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-muted-foreground">{product.description}</p>

              {/* Size Selection */}
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes?.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.colors?.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{product.stock_quantity} available</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={loading || product.stock_quantity === 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  variant="default"
                  onClick={handleBuyNow}
                  disabled={loading || product.stock_quantity === 0}
                >
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 bg-transparent"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
