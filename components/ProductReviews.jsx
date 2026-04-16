"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star, User, Shield, Edit2, Trash2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function ProductReviews({ productId }) {
    const [reviews, setReviews] = useState([])
    const [reviewStats, setReviewStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [userReview, setUserReview] = useState(null)
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [rating, setRating] = useState(0)
    const [reviewText, setReviewText] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [editing, setEditing] = useState(false)
    const [hasPurchased, setHasPurchased] = useState(false)
    const [checkingPurchase, setCheckingPurchase] = useState(false)
    const router = useRouter()

    useEffect(() => {
        let mounted = true

        const loadData = async () => {
            if (mounted) {
                await fetchReviews()
                await checkUser()
            }
        }

        loadData()

        return () => {
            mounted = false
        }
    }, [productId])

    const checkUser = async () => {
        try {
            const supabase = getSupabaseBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                setCheckingPurchase(true)

                try {
                    // Fetch user review data via API
                    const response = await fetch(`/api/reviews/user/${productId}`)
                    const result = await response.json()

                    if (response.ok) {
                        setHasPurchased(result.hasPurchased || false)

                        if (result.userReview) {
                            setUserReview(result.userReview)
                            setRating(result.userReview.rating)
                            setReviewText(result.userReview.review_text)
                        }
                    } else {
                        console.error("Error fetching user review:", result.error)
                        setHasPurchased(false)
                    }
                } catch (error) {
                    console.error("Error checking user review:", error)
                    setHasPurchased(false)
                }

                setCheckingPurchase(false)
            }
        } catch (error) {
            console.error("Error in checkUser:", error)
            setCheckingPurchase(false)
        }
    }

    const fetchReviews = async () => {
        try {
            // Fetch reviews via API
            const response = await fetch(`/api/reviews/${productId}`)
            const result = await response.json()

            if (response.ok) {
                setReviews(result.reviews || [])
                setReviewStats(result.stats)
            } else {
                console.error("Error fetching reviews:", result.error)
                setReviews([])
                setReviewStats(null)
            }
        } catch (error) {
            console.error("Error fetching reviews:", error)
            setReviews([])
            setReviewStats(null)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitReview = async () => {
        if (!user) {
            router.push("/login")
            return
        }

        if (!hasPurchased) {
            alert("You can only review products after your order is completed")
            return
        }

        if (rating === 0 || !reviewText.trim()) {
            alert("Please provide both rating and review text")
            return
        }

        setSubmitting(true)
        const supabase = getSupabaseBrowserClient()

        try {
            const reviewData = {
                product_id: productId,
                user_id: user.id,
                rating,
                review_text: reviewText.trim(),
                is_verified_purchase: true // Always true since we verify purchase before allowing review
            }

            let result
            let reviewId = null

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
                    .select()

                if (result.data && result.data.length > 0) {
                    reviewId = result.data[0].id
                }
            } else {
                // Insert new review
                result = await supabase
                    .from("product_reviews")
                    .insert(reviewData)
                    .select()

                if (result.data && result.data.length > 0) {
                    reviewId = result.data[0].id
                }
            }

            if (result.error) {
                console.error("Error submitting review:", result.error)
                if (result.error.message?.includes("has_purchased_product")) {
                    alert("You can only review products after your order is completed.")
                } else {
                    alert("Error submitting review. Please try again.")
                }
            } else {
                // Send admin notification email for new reviews (not edits)
                if (!editing && reviewId) {
                    try {
                        await fetch('/api/reviews/notify-admin', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                reviewId: reviewId,
                                productId: productId,
                                userId: user.id
                            })
                        })
                    } catch (emailError) {
                        console.error("Error sending admin notification:", emailError)
                        // Don't show error to user as review was still submitted successfully
                    }
                }

                alert(editing ? "Review updated successfully!" : "Review submitted successfully!")
                setShowReviewForm(false)
                setEditing(false)
                fetchReviews()
                checkUser()
            }
        } catch (error) {
            console.error("Error submitting review:", error)
            alert("Error submitting review. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

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
                fetchReviews()
            }
        } catch (error) {
            console.error("Error deleting review:", error)
            alert("Error deleting review. Please try again.")
        }
    }

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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="border rounded-lg p-4">
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 py-8 border-t border-gray-200">
            {/* Section Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
                <p className="text-gray-600">See what our customers are saying</p>
            </div>

            {/* Review Statistics */}
            {reviewStats && reviewStats.total_reviews > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Customer Reviews ({reviewStats.total_reviews})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-3xl font-bold">{reviewStats.average_rating}</div>
                            <div>
                                <StarRating rating={Math.round(reviewStats.average_rating)} />
                                <p className="text-sm text-gray-600 mt-1">
                                    Based on {reviewStats.total_reviews} reviews
                                </p>
                            </div>
                        </div>                        {/* Rating Distribution */}
                        <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Breakdown</h4>
                            <div className="space-y-3">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const count = reviewStats[`${stars === 1 ? 'one' : stars === 2 ? 'two' : stars === 3 ? 'three' : stars === 4 ? 'four' : 'five'}_star_count`]
                                    const percentage = reviewStats.total_reviews ? (count / reviewStats.total_reviews) * 100 : 0

                                    return (
                                        <div key={stars} className="flex items-center gap-3 text-sm">
                                            <span className="w-6 text-right font-medium">{stars}</span>
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="w-12 text-right font-medium text-gray-600">({count})</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}            {/* Review Form */}
            {user && (
                <>
                    {hasPurchased ? (
                        <Card className="border-2 border-blue-100 bg-blue-50/30">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Star className="w-5 h-5 text-blue-600" />
                                    {userReview ? "Your Review" : "Write a Review"}
                                </CardTitle>
                                {!userReview && (
                                    <p className="text-sm text-gray-600">Share your experience with this product</p>
                                )}
                            </CardHeader>
                            <CardContent>
                                {userReview && !showReviewForm && !editing ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <StarRating rating={userReview.rating} />
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditing(true)
                                                        setShowReviewForm(true)
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleDeleteReview}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-gray-700">{userReview.review_text}</p>
                                        <p className="text-sm text-gray-500">
                                            {editing ? "Updated" : "Reviewed"} on {formatDate(userReview.created_at)}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {!showReviewForm ? (
                                            <Button onClick={() => setShowReviewForm(true)}>
                                                {userReview ? "Edit Your Review" : "Write a Review"}
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>Rating</Label>
                                                    <StarRating
                                                        rating={rating}
                                                        interactive={true}
                                                        onRatingChange={setRating}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="review-text">Your Review</Label>
                                                    <Textarea
                                                        id="review-text"
                                                        placeholder="Share your thoughts about this product..."
                                                        value={reviewText}
                                                        onChange={(e) => setReviewText(e.target.value)}
                                                        rows={4}
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={handleSubmitReview}
                                                        disabled={submitting || rating === 0 || !reviewText.trim()}
                                                    >
                                                        {submitting ? "Submitting..." : (editing ? "Update Review" : "Submit Review")}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowReviewForm(false)
                                                            setEditing(false)
                                                            if (!userReview) {
                                                                setRating(0)
                                                                setReviewText("")
                                                            }
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                            <CardContent className="pt-8 pb-8 text-center">
                                <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Order Required to Review</h3>
                                <p className="text-gray-600 mb-4">You can only write reviews after your order is completed</p>
                                {checkingPurchase && (
                                    <p className="text-sm text-gray-500">Checking purchase history...</p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}{!user && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="pt-8 pb-8 text-center">
                        <MessageSquare className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Your Experience</h3>
                        <p className="text-gray-600 mb-6">Sign in to write a review and help other customers</p>
                        <Button
                            onClick={() => router.push("/login")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                        >
                            Sign In to Review
                        </Button>
                    </CardContent>
                </Card>
            )}            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div className="space-y-6">
                    <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">All Reviews</h3>
                    </div>
                    {reviews.map((review) => (
                        <Card key={review.id} className="hover:shadow-md transition-shadow duration-200">
                            <CardContent className="pt-6 pb-6">
                                <div className="flex items-start gap-4">
                                    <Avatar>
                                        <AvatarFallback>
                                            <User className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium">
                                                {review.profiles?.full_name || "Anonymous User"}
                                            </span>
                                            {review.is_verified_purchase && (
                                                <Badge variant="secondary" className="text-xs">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Verified Purchase
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <StarRating rating={review.rating} />
                                            <span className="text-sm text-gray-500">
                                                {formatDate(review.created_at)}
                                            </span>
                                        </div>

                                        <p className="text-gray-700 leading-relaxed">
                                            {review.review_text}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>) : (
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="pt-8 pb-8 text-center">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Be the first to share your thoughts about this product and help other customers make informed decisions.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
