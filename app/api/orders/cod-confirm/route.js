import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from "@/lib/email-service"

export async function POST(request) {
    try {
        const body = await request.json()
        const { orderId } = body || {}

        const supabase = await getSupabaseServerClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Fetch order with items and profile using service role
        const service = getSupabaseServiceRoleClient()
        const { data: order, error } = await service
            .from("orders")
            .select("*, order_items (*), profiles (*)")
            .eq("id", orderId)
            .single()

        if (error || !order) {
            return NextResponse.json({ error: error?.message || "Order not found" }, { status: 404 })
        }

        // Security: ensure the order belongs to the caller
        if (order.user_id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Send emails
        let emailResults = {}
        try {
            if (order.profiles?.email) {
                emailResults.customer = await sendOrderConfirmationEmail(order, order.profiles.email)
            }
            emailResults.admin = await sendNewOrderNotificationToAdmin(order, order.order_items || [], order.profiles)
        } catch (e) {
            // Don't fail request on email error
            emailResults.error = e?.message || String(e)
        }

        return NextResponse.json({ success: true, emailResults })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
