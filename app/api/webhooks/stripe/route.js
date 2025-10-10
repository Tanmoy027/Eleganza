import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"

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

        const supabase = await getSupabaseServerClient()

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object
                const orderId = session.metadata.orderId

                // Update order status
                await supabase
                    .from("orders")
                    .update({
                        payment_status: "paid",
                        status: "confirmed",
                        stripe_payment_intent_id: session.payment_intent,
                    })
                    .eq("id", orderId)

                console.log(`Payment successful for order: ${orderId}`)
                break
            }

            case "checkout.session.expired": {
                const session = event.data.object
                const orderId = session.metadata.orderId

                // Update order status to expired
                await supabase
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
