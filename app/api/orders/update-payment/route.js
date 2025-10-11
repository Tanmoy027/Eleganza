import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
    try {
        const { sessionId } = await request.json()

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
        }

        const supabase = await getSupabaseServerClient()

        // Get current user
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Verify payment status with Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        console.log("Stripe session retrieved:", {
            id: session.id,
            payment_status: session.payment_status,
            payment_intent: session.payment_intent
        })

        if (session.payment_status !== "paid") {
            return NextResponse.json({
                error: "Payment not completed",
                paymentStatus: session.payment_status
            }, { status: 400 })
        }

        // Use service role client for system write
        const serviceClient = getSupabaseServiceRoleClient()

        // Update order status by session id only; avoid RLS and .single()
        const { data: updatedArr, error: updateError } = await serviceClient
            .from("orders")
            .update({
                payment_status: "paid",
                status: "confirmed",
                stripe_payment_intent_id: session.payment_intent,
            })
            .eq("stripe_session_id", sessionId)
            .select("id, order_number, payment_status, status")

        if (updateError) {
            console.error("Error updating order:", updateError)
            return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
        }

        const updatedOrder = Array.isArray(updatedArr) && updatedArr.length > 0 ? updatedArr[0] : null

        if (!updatedOrder) {
            console.warn("No order matched for session during update; relying on webhook")
            return NextResponse.json({
                success: false,
                message: "No matching order updated; webhook may update shortly",
            })
        }

        console.log("Order updated successfully:", updatedOrder)

        return NextResponse.json({
            success: true,
            order: updatedOrder
        })

    } catch (error) {
        console.error("Error in payment update API:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
