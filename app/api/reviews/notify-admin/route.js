import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { sendNewReviewNotificationToAdmin } from "@/lib/email-service"

export async function POST(request) {
    try {
        const { reviewId, productId, userId } = await request.json()

        if (!reviewId || !productId || !userId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        const supabase = await getSupabaseServerClient()        // Get review details with product and user information
        const { data: reviewData, error: reviewError } = await supabase
            .from("product_reviews")
            .select(`
                *,
                products:product_id (
                    name,
                    price,
                    discount_price,
                    image_url,
                    images
                ),
                profiles:user_id (
                    full_name,
                    email
                )
            `)
            .eq("id", reviewId)
            .single()

        if (reviewError || !reviewData) {
            console.error("Error fetching review data:", reviewError)
            return NextResponse.json(
                { error: "Review not found" },
                { status: 404 }
            )
        }

        // Send admin notification email
        const emailResult = await sendNewReviewNotificationToAdmin(
            reviewData,
            reviewData.products,
            reviewData.profiles
        )

        if (emailResult.success) {
            return NextResponse.json({ 
                success: true, 
                message: "Admin notification sent successfully" 
            })
        } else {
            console.error("Error sending admin notification:", emailResult.error)
            return NextResponse.json(
                { error: "Failed to send admin notification" },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error("Error in review admin notification:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
