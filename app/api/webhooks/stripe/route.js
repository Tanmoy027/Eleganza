import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
    try {
        const body = await request.text()
        const signature = request.headers.get("stripe-signature")

        let event

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err) {
            console.error("Webhook signature verification failed:", err.message)
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
        }

        // Use service role for DB writes in webhooks
        const serviceClient = getSupabaseServiceRoleClient()

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object
                const orderId = session.metadata.orderId
                const sessionId = session.id

                console.log(`Processing payment for order: ${orderId}, session: ${sessionId}`)
                console.log("Session payment status:", session.payment_status)

                if (session.payment_status === "paid") {
                    // Update order status using both order ID and session ID for reliability
                    const { data, error } = await serviceClient
                        .from("orders")
                        .update({
                            payment_status: "paid",
                            status: "confirmed",
                            stripe_payment_intent_id: session.payment_intent,
                            stripe_session_id: sessionId, // Ensure session ID is stored
                        })
                        .eq("id", orderId)
                        .select()

                    if (error) {
                        console.error("Error updating order in webhook:", error)

                        // Try alternative update using session ID if order ID fails
                        const { data: altData, error: altError } = await serviceClient
                            .from("orders")
                            .update({
                                payment_status: "paid",
                                status: "confirmed",
                                stripe_payment_intent_id: session.payment_intent,
                            })
                            .eq("stripe_session_id", sessionId)
                            .select()

                        if (altError) {
                            console.error("Alternative update also failed:", altError)
                        } else {
                            console.log(`Payment successful for session: ${sessionId} (alternative method)`, altData)
                        }
                    } else {
                        console.log(`Payment successful for order: ${orderId}`, data)
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
