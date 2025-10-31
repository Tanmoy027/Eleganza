import { NextResponse } from "next/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from "@/lib/email-service"

export async function POST(request) {
    try {
        const { orderId } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: "Order ID required" }, { status: 400 })
        }

        console.log("🧪 Testing email system for order:", orderId)

        const serviceClient = getSupabaseServiceRoleClient()

        // Get order details
        const { data: orderData, error } = await serviceClient
            .from("orders")
            .select(`
                *,
                order_items (*),
                profiles (*)
            `)
            .eq("id", orderId)
            .single()

        if (error || !orderData) {
            console.error("Order not found:", error)
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        console.log("📋 Order found:", orderData.order_number)
        console.log("👤 Customer email:", orderData.profiles?.email)

        const results = {}

        // Test customer email
        if (orderData.profiles?.email) {
            console.log("📧 Testing customer confirmation email...")
            const customerResult = await sendOrderConfirmationEmail(orderData, orderData.profiles.email)
            results.customerEmail = customerResult
        } else {
            results.customerEmail = { success: false, error: "No customer email found" }
        }

        // Test admin email
        console.log("📧 Testing admin notification email...")
        const adminResult = await sendNewOrderNotificationToAdmin(
            orderData,
            orderData.order_items || [],
            orderData.profiles
        )
        results.adminEmail = adminResult

        return NextResponse.json({
            success: true,
            orderId,
            orderNumber: orderData.order_number,
            results
        })

    } catch (error) {
        console.error("❌ Test email error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
