import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"
import { sendOrderStatusUpdateEmail } from "@/lib/email-service"

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
        } const oldStatus = currentOrder.status

        // Check if order is cancelled - admin cannot update cancelled orders
        if (oldStatus === 'cancelled') {
            return NextResponse.json(
                { error: "Cannot update status of cancelled orders" },
                { status: 400 }
            )
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

        // Update order status
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

        // Add tracking entry
        const { error: trackingError } = await serviceClient
            .from("order_tracking")
            .insert({
                order_id: orderId,
                status,
                message: message?.trim() || `Order status updated to ${status.replace('_', ' ')} by admin`
            })

        if (trackingError) {
            console.error("Error adding tracking entry:", trackingError)
            // Don't fail the request if tracking fails
        }

        // Send email notification to customer if they have an email
        if (updatedOrder.profiles?.email) {
            try {
                const emailResult = await sendOrderStatusUpdateEmail(
                    updatedOrder,
                    updatedOrder.profiles.email,
                    oldStatus,
                    status
                )

                if (!emailResult.success) {
                    console.error("Failed to send status update email:", emailResult.error)
                    // Don't fail the request if email fails, but log it
                } else {
                    console.log("Status update email sent successfully")
                }
            } catch (emailError) {
                console.error("Error sending status update email:", emailError)
                // Don't fail the request if email fails
            }
        } else {
            console.log("No customer email found, skipping status update email")
        }

        return NextResponse.json({
            success: true,
            message: `Order status updated to ${status.replace('_', ' ')} successfully`,
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
