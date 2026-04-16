import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from "@/lib/email-service"
import { adjustInventoryForOrder } from "@/lib/inventory-server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
    try {
        console.log("🎯 Webhook received!")
        const body = await request.text()
        const signature = request.headers.get("stripe-signature")

        console.log("📝 Webhook secret configured:", webhookSecret ? "Yes" : "No")
        console.log("📝 Signature present:", signature ? "Yes" : "No")

        let event

        // If webhook secret is the placeholder, skip verification in development
        if (webhookSecret === "whsec_your_webhook_secret_here" || !webhookSecret) {
            console.log("⚠️ Using webhook without signature verification (development mode)")
            event = JSON.parse(body)
        } else {
            try {
                event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
            } catch (err) {
                console.error("Webhook signature verification failed:", err.message)
                return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
            }
        }

        console.log("📨 Webhook event type:", event.type)

        // Use service role for DB writes in webhooks
        const serviceClient = getSupabaseServiceRoleClient()

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object
                const orderId = session.metadata.orderId
                const sessionId = session.id
                const isGift = session.metadata?.isGift === "true"

                console.log(`Processing payment for order: ${orderId}, session: ${sessionId}`)
                console.log("Session payment status:", session.payment_status)

                if (session.payment_status === "paid") {                    // Update order status using both order ID and session ID for reliability
                    const { data, error } = await serviceClient
                        .from("orders")
                        .update({
                            payment_status: "paid",
                            status: "pending", // Keep status as pending until admin confirms
                            stripe_payment_intent_id: session.payment_intent,
                            stripe_session_id: sessionId, // Ensure session ID is stored
                        })
                        .eq("id", orderId)
                        .select(`
                            *,
                            order_items (*),
                            profiles (*)
                        `)

                    let orderData = null

                    if (error) {
                        console.error("Error updating order in webhook:", error)                        // Try alternative update using session ID if order ID fails
                        const { data: altData, error: altError } = await serviceClient
                            .from("orders")
                            .update({
                                payment_status: "paid",
                                status: "pending", // Keep status as pending until admin confirms
                                stripe_payment_intent_id: session.payment_intent,
                            })
                            .eq("stripe_session_id", sessionId)
                            .select(`
                                *,
                                order_items (*),
                                profiles (*)
                            `)

                        if (altError) {
                            console.error("Alternative update also failed:", altError)
                        } else {
                            console.log(`Payment successful for session: ${sessionId} (alternative method)`, altData)
                            orderData = altData[0]
                        }
                    } else {
                        console.log(`Payment successful for order: ${orderId}`, data)
                        orderData = data[0]
                    }                    // Send email notifications if order was successfully updated
                    if (orderData) {
                        // Add tracking entry for payment completion
                        await serviceClient
                            .from("order_tracking")
                            .insert({
                                order_id: orderData.id,
                                status: "pending",
                                message: isGift ? "Gift order created and payment received. Awaiting admin confirmation." : "Order created and payment received. Awaiting admin confirmation."
                            })

                        console.log("📧 Sending email notifications...")
                        console.log("Customer email:", orderData.profiles?.email)
                        console.log("Admin email:", process.env.ADMIN_EMAIL)

                        try {
                            // Send confirmation email to customer
                            if (orderData.profiles?.email) {
                                console.log("📧 Sending customer confirmation email...")
                                const customerEmailResult = await sendOrderConfirmationEmail(orderData, orderData.profiles.email)
                                console.log("📧 Customer email result:", customerEmailResult)
                            } else {
                                console.log("⚠️ No customer email found")
                            }

                            // Send notification email to admin
                            console.log("📧 Sending admin notification email...")
                            const adminEmailResult = await sendNewOrderNotificationToAdmin(
                                orderData,
                                orderData.order_items || [],
                                orderData.profiles
                            )
                            console.log("📧 Admin email result:", adminEmailResult)
                        } catch (emailError) {
                            console.error("❌ Error sending email notifications:", emailError)
                            // Don't fail the webhook if email fails
                        }
                    } else {
                        console.log("⚠️ No order data found, skipping email notifications")
                    }
                } else {
                    console.log(`Payment not completed yet for session: ${sessionId}, status: ${session.payment_status}`)
                }
                break
            }

            case "checkout.session.expired": {
                const session = event.data.object
                const orderId = session.metadata.orderId

                // Update order status to expired
                await serviceClient
                    .from("orders")
                    .update({
                        payment_status: "failed",
                        status: "cancelled",
                    })
                    .eq("id", orderId)

                const { error: restockError } = await adjustInventoryForOrder({
                    orderId,
                    action: "restock",
                    actor: "stripe_expired"
                })

                if (restockError) {
                    console.error("Error restocking inventory for expired checkout:", restockError)
                }

                console.log(`Payment expired for order: ${orderId}`)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Webhook error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
