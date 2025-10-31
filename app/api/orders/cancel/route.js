import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { sendOrderCancellationNotificationToAdmin } from "@/lib/email-service"

export async function POST(request) {
    try {
        const { orderId } = await request.json()

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            )
        }

        const supabase = await getSupabaseServerClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // First check if order can be cancelled and get full order data
        const { data: order } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (*),
                profiles (*)
            `)
            .eq("id", orderId)
            .eq("user_id", user.id)
            .single()

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            )
        }

        if (order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
            return NextResponse.json(
                { error: "Order cannot be cancelled once it has been confirmed or is in progress" },
                { status: 400 }
            )
        }

        // Update order status
        const { data, error } = await supabase
            .from("orders")
            .update({
                status: "cancelled",
                payment_status: "refunded"
            })
            .eq("id", orderId)
            .eq("user_id", user.id)
            .select()

        if (error) {
            return NextResponse.json(
                { error: "Failed to cancel order" },
                { status: 500 }
            )
        }

        // Add tracking entry for cancellation
        await supabase
            .from("order_tracking")
            .insert({
                order_id: orderId,
                status: "cancelled",
                message: "Order cancelled by customer"
            })

        // Send email notification to admin about order cancellation
        try {
            await sendOrderCancellationNotificationToAdmin(order, order.order_items, order.profiles)
            console.log('📧 Order cancellation notification sent to admin successfully')
        } catch (emailError) {
            console.error('❌ Error sending order cancellation notification to admin:', emailError)
            // Don't throw error for email failure - order cancellation should still succeed
        }

        return NextResponse.json({
            success: true,
            message: "Order cancelled successfully"
        })

    } catch (error) {
        console.error("Error cancelling order:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
