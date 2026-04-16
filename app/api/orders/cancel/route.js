import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { sendOrderCancellationNotificationToAdmin } from "@/lib/email-service"
import { sendOrderCancellationEmailToCustomer } from "@/lib/email-service"
import { adjustInventoryForOrder } from "@/lib/inventory-server"

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

        // Check if order is already cancelled (case insensitive)
        if (order.status?.toLowerCase() === 'cancelled') {
            return NextResponse.json(
                { error: "Order is already cancelled" },
                { status: 400 }
            )
        }

        // Check if order can be cancelled based on current status (case-insensitive)
        const normalizedStatus = (order.status || '').toLowerCase()
        if (["confirmed", "processing", "shipped", "delivered", "completed"].includes(normalizedStatus)) {
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
            console.error("Database error:", error)
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

        // Restock inventory after cancellation
        const { error: restockError } = await adjustInventoryForOrder({
            orderId,
            action: "restock",
            actor: "customer_cancel"
        })

        if (restockError) {
            console.error("Error restocking inventory on customer cancel:", restockError)
        }

        // Send email notification to admin about order cancellation
        try {
            await sendOrderCancellationNotificationToAdmin(order, order.order_items, order.profiles)
            console.log('📧 Order cancellation notification sent to admin successfully')
        } catch (emailError) {
            console.error('❌ Error sending order cancellation notification to admin:', emailError)
            // Don't throw error for email failure - order cancellation should still succeed
        }

        // Send email to customer about cancellation and refund info
        try {
            const customerEmail = order?.profiles?.email || order?.email || user?.email
            if (customerEmail) {
                const wasPaid = String(order?.payment_status || '').toLowerCase() === 'paid'
                const paymentMethod = order?.payment_method
                await sendOrderCancellationEmailToCustomer(order, customerEmail, { wasPaid, paymentMethod })
                console.log('📧 Order cancellation email sent to customer successfully')
            } else {
                console.warn('⚠️ No customer email found to send cancellation notice')
            }
        } catch (emailError) {
            console.error('❌ Error sending order cancellation email to customer:', emailError)
            // Do not fail the API due to email error
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
