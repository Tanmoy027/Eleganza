"use client"

import { useState } from "react"
import { Star, User, Shield, Eye, EyeOff, Trash2, MessageSquare, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import Image from "next/image"

export function AdminReviewsClient({ initialReviews, initialStats }) {
    const [reviews, setReviews] = useState(initialReviews)
    const [stats, setStats] = useState(initialStats)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState("all") // all, approved, pending

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = !searchTerm ||
            review.review_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "approved" && review.is_approved) ||
            (filterStatus === "pending" && !review.is_approved)

        return matchesSearch && matchesStatus
    })

    const handleToggleApproval = async (reviewId, currentStatus) => {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        try {
            const { error } = await supabase
                .from("product_reviews")
                .update({ is_approved: !currentStatus })
                .eq("id", reviewId)

            if (error) {
                console.error("Error updating review approval:", error)
                alert("Error updating review status")
            } else {
                setReviews(reviews.map(review =>
                    review.id === reviewId
                        ? { ...review, is_approved: !currentStatus }
                        : review
                ))
                alert(`Review ${!currentStatus ? 'approved' : 'disapproved'} successfully`)
            }
        } catch (error) {
            console.error("Error updating review approval:", error)
            alert("Error updating review status")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteReview = async (reviewId) => {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        try {
            const { error } = await supabase
                .from("product_reviews")
                .delete()
                .eq("id", reviewId)

            if (error) {
                console.error("Error deleting review:", error)
                alert("Error deleting review")
            } else {
                setReviews(reviews.filter(review => review.id !== reviewId))
                alert("Review deleted successfully")
            }
        } catch (error) {
            console.error("Error deleting review:", error)
            alert("Error deleting review")
        } finally {
            setLoading(false)
        }
    }

    const StarRating = ({ rating }) => (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                />
            ))}
        </div>
    )

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getStatusCounts = () => {
        const approved = reviews.filter(r => r.is_approved).length
        const pending = reviews.filter(r => !r.is_approved).length
        return { approved, pending, total: reviews.length }
    }

    const statusCounts = getStatusCounts()

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                                <p className="text-2xl font-bold">{statusCounts.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <Eye className="h-4 w-4 text-green-600" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <EyeOff className="h-4 w-4 text-orange-600" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-orange-600">{statusCounts.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <div className="ml-2">
                                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {reviews.length > 0
                                        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                        : "0.0"
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="reviews" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    <TabsTrigger value="stats">Product Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="reviews" className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="search">Search Reviews</Label>
                                    <Input
                                        id="search"
                                        placeholder="Search by product, user, or review content..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="status">Filter by Status</Label>
                                    <select
                                        id="status"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                    >
                                        <option value="all">All Reviews</option>
                                        <option value="approved">Approved Only</option>
                                        <option value="pending">Pending Only</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reviews List */}
                    <div className="space-y-4">
                        {filteredReviews.length > 0 ? (
                            filteredReviews.map((review) => (
                                <Card key={review.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <div className="flex-shrink-0">
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                                                    <Image
                                                        src={review.products?.image_url || "/placeholder.svg"}
                                                        alt={review.products?.name || "Product"}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            </div>

                                            {/* Review Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-medium text-sm truncate">
                                                            {review.products?.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Avatar className="w-6 h-6">
                                                                <AvatarFallback className="text-xs">
                                                                    <User className="w-3 h-3" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm text-muted-foreground">
                                                                {review.profiles?.full_name || "Anonymous"}
                                                            </span>
                                                            {review.is_verified_purchase && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <Shield className="w-3 h-3 mr-1" />
                                                                    Verified
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={review.is_approved ? "default" : "secondary"}>
                                                            {review.is_approved ? "Approved" : "Pending"}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 mb-2">
                                                    <StarRating rating={review.rating} />
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(review.created_at)}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                                                    {review.review_text}
                                                </p>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleApproval(review.id, review.is_approved)}
                                                        disabled={loading}
                                                    >
                                                        {review.is_approved ? (
                                                            <>
                                                                <EyeOff className="w-4 h-4 mr-1" />
                                                                Disapprove
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Approve
                                                            </>
                                                        )}
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="outline" size="sm" disabled={loading}>
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                                Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Review</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete this review? This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteReview(review.id)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No reviews found matching your criteria.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="stats" className="space-y-4">
                    {/* Product Review Statistics */}
                    <div className="grid gap-4">
                        {stats.length > 0 ? (
                            stats.map((stat) => (
                                <Card key={stat.product_id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-medium">{stat.product_name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {stat.total_reviews} reviews • {stat.average_rating} average rating
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold">{stat.average_rating}</div>
                                                <StarRating rating={Math.round(stat.average_rating)} />
                                            </div>
                                        </div>

                                        {/* Rating Distribution */}
                                        <div className="space-y-2">
                                            {[5, 4, 3, 2, 1].map((stars) => {
                                                const count = stat[`${stars === 1 ? 'one' : stars === 2 ? 'two' : stars === 3 ? 'three' : stars === 4 ? 'four' : 'five'}_star_count`]
                                                const percentage = stat.total_reviews ? (count / stat.total_reviews) * 100 : 0

                                                return (
                                                    <div key={stars} className="flex items-center gap-2 text-sm">
                                                        <span className="w-8">{stars}</span>
                                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="w-12 text-right">{count}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No review statistics available yet.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
