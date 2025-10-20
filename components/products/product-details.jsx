"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Heart, Star, ChevronDown, Truck, Package, Shield, Clock, Send, MessageSquare, Edit2, Trash2 } from "lucide-react"
import { addToCart } from "@/lib/cart"
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist"
import { getProductMainImage, getProductImages, handleImageError as handleImgError } from "@/lib/image-utils"
import { ProductReviews } from "@/components/ProductReviews"
import { ProductCard } from "./product-card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function ProductDetails({ product, similarProducts = [], reviews = [] }) {
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

  // Review-related state
  const [user, setUser] = useState(null)
  const [userReview, setUserReview] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [reviewsData, setReviewsData] = useState(reviews)

  // Get all valid images for the gallery
  const productImages = getProductImages(product)

  useEffect(() => {
    async function checkWishlist() {
      const isInList = await isInWishlist(product.id)
      setInWishlist(isInList)
    }
    checkWishlist()
    checkUser()
  }, [product.id])

  // Check if user is logged in and has existing review
  const checkUser = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // Check if user already has a review for this product
      const { data: existingReview } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", product.id)
        .eq("user_id", user.id)
        .single()

      if (existingReview) {
        setUserReview(existingReview)
        setRating(existingReview.rating)
        setReviewText(existingReview.review_text)
      }
    }
  }

  // Submit or update review
  const handleSubmitReview = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (rating === 0 || !reviewText.trim()) {
      alert("Please provide both rating and review text")
      return
    }

    setSubmitting(true)
    const supabase = getSupabaseBrowserClient()

    try {
      // Check if user has purchased this product for verified badge
      let hasPurchased = false
      try {
        const { data } = await supabase.rpc("has_purchased_product", {
          user_uuid: user.id,
          product_uuid: product.id
        })
        hasPurchased = data || false
      } catch (rpcError) {
        // If function doesn't exist or fails, default to false
        console.log("has_purchased_product function not available, defaulting to false")
        hasPurchased = false
      }

      const reviewData = {
        product_id: product.id,
        user_id: user.id,
        rating,
        review_text: reviewText.trim(),
        is_verified_purchase: hasPurchased
      }

      let result
      if (editing && userReview) {
        // Update existing review
        result = await supabase
          .from("product_reviews")
          .update({
            rating,
            review_text: reviewText.trim(),
            updated_at: new Date().toISOString()
          })
          .eq("id", userReview.id)
      } else {
        // Insert new review
        result = await supabase
          .from("product_reviews")
          .insert(reviewData)
      }

      if (result.error) {
        console.error("Error submitting review:", result.error)
        alert("Error submitting review. Please try again.")
      } else {
        alert(editing ? "Review updated successfully!" : "Review submitted successfully! It may take a moment to appear.")
        setShowReviewForm(false)
        setEditing(false)
        // Refresh reviews
        fetchUpdatedReviews()
        checkUser()
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Error submitting review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Fetch updated reviews after submission
  const fetchUpdatedReviews = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data: updatedReviews } = await supabase
      .from("product_reviews")
      .select(`
        *,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq("product_id", product.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })

    if (updatedReviews) {
      setReviewsData(updatedReviews)
    }
  }

  // Delete user's review
  const handleDeleteReview = async () => {
    if (!userReview) return

    if (!confirm("Are you sure you want to delete your review?")) return

    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", userReview.id)

      if (error) {
        console.error("Error deleting review:", error)
        alert("Error deleting review. Please try again.")
      } else {
        alert("Review deleted successfully!")
        setUserReview(null)
        setRating(0)
        setReviewText("")
        setEditing(false)
        setShowReviewForm(false)
        fetchUpdatedReviews()
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      alert("Error deleting review. Please try again.")
    }
  }

  // Star rating component
  const StarRating = ({ rating, interactive = false, onRatingChange }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRatingChange && onRatingChange(star)}
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`w-5 h-5 ${star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
              }`}
          />
        </button>
      ))}
    </div>
  )

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

  // Calculate review statistics
  const calculateReviewStats = () => {
    if (!reviewsData || reviewsData.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    }

    const totalReviews = reviewsData.length
    const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = (totalRating / totalReviews).toFixed(1)

    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviewsData.forEach(review => {
      ratingBreakdown[review.rating]++
    })

    return { averageRating, totalReviews, ratingBreakdown }
  }

  const reviewStats = calculateReviewStats()

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

        {/* Rating & Reviews Section */}
        <div className="mt-16 max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-medium mb-8">Rating & Reviews</h2>

            {reviewStats.totalReviews > 0 ? (
              <div className="grid md:grid-cols-3 gap-12">
                {/* Rating Summary */}
                <div>
                  <div className="text-7xl font-light mb-2">
                    {reviewStats.averageRating}<span className="text-2xl text-gray-400">/5</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-6">
                    ({reviewStats.totalReviews} Review{reviewStats.totalReviews !== 1 ? 's' : ''})
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(reviewStats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviewStats.ratingBreakdown[rating]
                    const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-8">
                          <span className="text-sm font-medium">{rating}</span>
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-6">{count}</span>
                      </div>
                    )
                  })}
                </div>


              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Star className="w-16 h-16 mx-auto fill-gray-200" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-500 mb-4">Be the first to review this product!</p>
                <div className="text-6xl font-light text-gray-300 mb-2">0.0<span className="text-2xl">/5</span></div>
                <div className="text-sm text-gray-400">(0 Reviews)</div>
              </div>
            )}

            {/* Write Review Section */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              {user ? (
                userReview ? (
                  /* User has already reviewed */
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Your Review</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(true)
                            setShowReviewForm(true)
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteReview}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={userReview.rating} />
                      <span className="text-sm text-gray-600">
                        {new Date(userReview.created_at).toLocaleDateString()}
                      </span>
                      {userReview.is_verified_purchase && (
                        <Badge className="bg-green-100 text-green-800">Verified Purchase</Badge>
                      )}
                    </div>
                    <p className="text-gray-700">"{userReview.review_text}"</p>
                  </div>
                ) : (
                  /* User hasn't reviewed yet */
                  !showReviewForm ? (
                    <div className="text-center">
                      <Button
                        onClick={() => setShowReviewForm(true)}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Write a Review
                      </Button>
                    </div>
                  ) : null
                )
              ) : (
                /* User not logged in */
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-4">Please login to write a review</p>
                  <Button onClick={() => router.push("/login")}>
                    Login to Review
                  </Button>
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">
                      {editing ? "Edit Your Review" : "Write Your Review"}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Rating *</Label>
                        <StarRating
                          rating={rating}
                          interactive={true}
                          onRatingChange={setRating}
                        />
                      </div>

                      <div>
                        <Label htmlFor="review" className="text-sm font-medium mb-2 block">
                          Review *
                        </Label>
                        <Textarea
                          id="review"
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your experience with this product..."
                          rows={4}
                          className="w-full"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={handleSubmitReview}
                          disabled={submitting || rating === 0 || !reviewText.trim()}
                          className="flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {editing ? "Updating..." : "Submitting..."}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              {editing ? "Update Review" : "Submit Review"}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowReviewForm(false)
                            setEditing(false)
                            if (!editing) {
                              setRating(0)
                              setReviewText("")
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* All Reviews */}
            {reviewsData.length > 0 && (
              <div className="mt-12 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium mb-6">
                  All Reviews ({reviewsData.length})
                </h3>
                <div className="space-y-6">
                  {reviewsData.map((review) => (
                    <div key={review.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-800">
                          {review.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {review.profiles?.full_name || 'Anonymous User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          "{review.review_text}"
                        </p>
                        {review.is_verified_purchase && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified Purchase
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
