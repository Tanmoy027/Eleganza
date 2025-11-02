import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"
import { sendOrderStatusUpdateEmail, sendOrderCancellationNotificationToAdmin, sendOrderCancellationEmailToCustomer } from "@/lib/email-service"

export async function POST(request) {
    try {
        const { orderId, status, message } = await request.json()

        if (!orderId || !status) {
            return NextResponse.json(
                { error: "Order ID and status are required" },
                { status: 400 }
            )
        }

        // Check if user is authenticated and has admin access
        const supabase = await getSupabaseServerClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // Use service role client for database operations
        const serviceClient = getSupabaseServiceRoleClient()

        // Get the current order details with customer info
        const { data: currentOrder, error: fetchError } = await serviceClient
            .from("orders")
            .select(`
        *,
        profiles (
          id,
          email,
          full_name
        )
      `)
            .eq("id", orderId)
            .single()

        if (fetchError || !currentOrder) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            )
        }
        const oldStatus = currentOrder.status

        // Check if order is cancelled - admin cannot update cancelled orders (case insensitive)
        if (oldStatus?.toLowerCase() === 'cancelled') {
            return NextResponse.json(
                { error: "Cannot update status of cancelled orders. Once an order is cancelled, it cannot be modified." },
                { status: 400 }
            )
        }

        // Extra safety: if any tracking entry is already marked cancelled, block updates too
        const { data: cancelledTrack } = await serviceClient
            .from("order_tracking")
            .select("id")
            .eq("order_id", orderId)
            .eq("status", "cancelled")
            .limit(1)
            .maybeSingle()

        if (cancelledTrack) {
            return NextResponse.json(
                { error: "This order has a cancellation record and cannot be modified." },
                { status: 400 }
            )
        }

        // Admin cancellation policy: allow only when current status is Pending
        if (status?.toLowerCase() === 'cancelled') {
            if ((oldStatus || '').toLowerCase() !== 'pending') {
                return NextResponse.json(
                    { error: "Admin can cancel only when order is Pending. After confirmation, cancellation is not allowed." },
                    { status: 400 }
                )
            }

            // Perform cancellation
            const { data: cancelledOrder, error: cancelErr } = await serviceClient
                .from("orders")
                .update({ status: 'cancelled', payment_status: 'refunded' })
                .eq("id", orderId)
                .select(`
                *,
                profiles (
                  id,
                  email,
                  full_name
                )
              `)
                .single()

            if (cancelErr) {
                console.error("Error cancelling order:", cancelErr)
                return NextResponse.json(
                    { error: "Failed to cancel order" },
                    { status: 500 }
                )
            }

            // Tracking entry for cancellation
            const cancelMsg = message?.trim() || 'Order cancelled by admin before confirmation.'
            const { error: trackingError } = await serviceClient
                .from("order_tracking")
                .insert({ order_id: orderId, status: 'cancelled', message: cancelMsg })

            if (trackingError) {
                console.error("Error adding cancellation tracking entry:", trackingError)
            }

            // Fetch items for email context
            const { data: orderItems } = await serviceClient
                .from('order_items')
                .select('product_name, quantity, size, color')
                .eq('order_id', orderId)

            // Send emails
            try {
                if (cancelledOrder?.profiles?.email) {
                    const wasPaid = String(currentOrder?.payment_status || '').toLowerCase() === 'paid'
                    const paymentMethod = currentOrder?.payment_method
                    await sendOrderCancellationEmailToCustomer(cancelledOrder, cancelledOrder.profiles.email, { wasPaid, paymentMethod })
                }
                await sendOrderCancellationNotificationToAdmin(cancelledOrder, orderItems || [], cancelledOrder?.profiles || null)
            } catch (emailErr) {
                console.error('Error sending cancellation emails:', emailErr)
            }

            return NextResponse.json({ success: true, message: 'Order cancelled successfully', order: cancelledOrder })
        }

        // Only proceed if status is actually changing
        if (oldStatus === status) {
            // If status is same, just add tracking note if message provided
            if (message?.trim()) {
                const { error: trackingError } = await serviceClient
                    .from("order_tracking")
                    .insert({
                        order_id: orderId,
                        status: status,
                        message: message.trim()
                    })

                if (trackingError) {
                    console.error("Error adding tracking note:", trackingError)
                    return NextResponse.json(
                        { error: "Failed to add tracking note" },
                        { status: 500 }
                    )
                }

                return NextResponse.json({
                    success: true,
                    message: "Tracking note added successfully"
                })
            }

            return NextResponse.json({
                success: true,
                message: "No changes made"
            })
        }

        // Update order status (non-cancellation flow)
        const { data: updatedOrder, error: updateError } = await serviceClient
            .from("orders")
            .update({ status })
            .eq("id", orderId)
            .select(`
        *,
        profiles (
          id,
          email,
          full_name
        )
      `)
            .single()

        if (updateError) {
            console.error("Error updating order status:", updateError)
            return NextResponse.json(
                { error: "Failed to update order status" },
                { status: 500 }
            )
        }

        // Fetch order items for including product details in emails
        const { data: orderItems } = await serviceClient
            .from('order_items')
            .select('product_name, quantity, size, color')
            .eq('order_id', orderId)

        // If status is set to delivered, generate OTP and email it with product details
        let otpCode = null
        const lowerStatus = status?.toLowerCase()
        const shouldSendOtp = lowerStatus === 'delivered' // send only on delivered per requirements
        if (shouldSendOtp) {
            // Generate random 4-digit OTP
            otpCode = Math.floor(1000 + Math.random() * 9000).toString()
        }

        const baseMsg = lowerStatus === 'delivered'
            ? `Order delivered successfully. ${message?.trim() || 'Order will be marked as completed automatically.'}`
            : (message?.trim() || `Order status updated to ${status.replace('_', ' ')} by admin`)

        const statusMessage = shouldSendOtp
            ? `${baseMsg}\n\nDelivery OTP: ${otpCode}. When receiving the order use this OTP.`
            : baseMsg

        // Add tracking entry for the status change
        const { error: trackingError } = await serviceClient
            .from("order_tracking")
            .insert({
                order_id: orderId,
                status,
                message: statusMessage
            })

        if (trackingError) {
            console.error("Error adding tracking entry:", trackingError)
            // Don't fail the request if tracking fails
        }

        // Add a separate OTP tracking entry for easier verification/display
        if (otpCode) {
            const { error: otpTrackErr } = await serviceClient
                .from("order_tracking")
                .insert({
                    order_id: orderId,
                    status: 'otp',
                    message: `Your delivery OTP is ${otpCode}`
                })
            if (otpTrackErr) {
                console.error('Failed to insert OTP tracking entry:', otpTrackErr)
            }
        }

        // Send email notification to customer if they have an email
        if (updatedOrder.profiles?.email) {
            try {
                // Send standard status update email and include OTP + items when available
                const emailResult = await sendOrderStatusUpdateEmail(
                    updatedOrder,
                    updatedOrder.profiles.email,
                    oldStatus,
                    status,
                    { otpCode, orderItems }
                )

                if (!emailResult.success) {
                    console.error("Failed to send status update email:", emailResult.error)
                } else {
                    console.log("Status update email sent successfully")
                }

            } catch (emailError) {
                console.error("Error sending status/OTP emails:", emailError)
                // Don't fail the request if email fails
            }
        } else {
            console.log("No customer email found, skipping emails")
        }

        return NextResponse.json({
            success: true,
            message: `Order status updated to ${status.replace('_', ' ')} successfully` + (otpCode ? ` (delivery OTP included in email)` : ''),
            order: updatedOrder
        })

    } catch (error) {
        console.error("Error in order status update API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
