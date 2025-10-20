"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import Link from "next/link"
import { getProductMainImage, handleImageError as handleImgError } from "@/lib/image-utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function ProductCard({ product }) {
    const [imageSrc, setImageSrc] = useState(getProductMainImage(product))
    const [imageError, setImageError] = useState(false)
    const [reviewStats, setReviewStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReviewStats()
    }, [product.id])

    const fetchReviewStats = async () => {
        const supabase = getSupabaseBrowserClient()

        try {
            const { data } = await supabase
                .from("product_review_stats")
                .select("*")
                .eq("product_id", product.id)
                .single()

            setReviewStats(data)
        } catch (error) {
            console.error("Error fetching review stats:", error)
        } finally {
            setLoading(false)
        }
    }

    // Handle image load error
    const handleImageError = (e) => {
        if (!imageError) {
            setImageError(true)
            setImageSrc("/placeholder.svg")
            handleImgError(e)
        }
    }

    const StarRating = ({ rating, totalReviews }) => (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                        }`}
                />
            ))}
            {totalReviews > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                    ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                </span>
            )}
        </div>
    )

    return (
        <div className="group cursor-pointer">
            <Link href={`/products/${product.id}`}>
                <div className="relative mb-4 overflow-hidden cursor-pointer">
                    <Image
                        src={imageSrc}
                        alt={product.name}
                        width={300}
                        height={400}
                        className="w-full h-80 md:h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                    />                    {product.isNew && (
                        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-medium">NEW</div>
                    )}
                    {product.is_on_discount && product.discount_percentage && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs font-medium">
                            {product.discount_percentage}% OFF
                        </div>
                    )}
                    {product.isOffer && !product.is_on_discount && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs font-medium">SALE</div>
                    )}
                    {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-white text-black px-3 py-1 text-sm font-medium">Out of Stock</span>
                        </div>
                    )}
                </div>
            </Link>

            <div className="space-y-2">
                <Link href={`/products/${product.id}`}>
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-gray-600 cursor-pointer transition-colors">
                        {product.name}
                    </h3>
                </Link>

                {!loading && (
                    <StarRating
                        rating={reviewStats?.average_rating || 0}
                        totalReviews={reviewStats?.total_reviews || 0}
                    />
                )}                <div className="space-y-1">
                    <div className="flex items-center space-x-2">                        {product.is_on_discount && product.discount_price && product.discount_percentage ? (
                        <>
                            <span className="text-sm font-medium text-red-600">৳{Number(product.discount_price).toFixed(2)}</span>
                            <span className="text-sm text-gray-400 line-through">৳{Number(product.price).toFixed(2)}</span>
                        </>
                    ) : (
                        <span className="text-sm font-medium">৳{Number(product.price).toFixed(2)}</span>
                    )}
                    </div>                    {product.is_on_discount && product.discount_price && product.discount_percentage && (
                        <div className="text-xs text-green-600 font-medium">
                            Save ৳{(product.price - product.discount_price).toFixed(2)} ({product.discount_percentage}% off)
                        </div>
                    )}

                    {/* Category and occasion badges */}
                    <div className="flex gap-1 flex-wrap">
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded capitalize">
                            {product.category}
                        </span>
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded capitalize">
                            {product.occasion}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
