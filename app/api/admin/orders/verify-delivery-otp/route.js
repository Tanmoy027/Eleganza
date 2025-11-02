// filepath: f:\\web development\\24 project\\apu\\new version\\shuvaapumain\\app\\api\\admin\\orders\\verify-delivery-otp\\route.js
import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"
import { sendOrderStatusUpdateEmail } from "@/lib/email-service"

export async function POST(request) {
    try {
        const body = await request.json()
        const { orderIdentifier, otp } = body || {}

        if (!orderIdentifier || !otp) {
            return NextResponse.json({ error: "orderIdentifier and otp are required" }, { status: 400 })
        }

        const supabase = await getSupabaseServerClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const service = getSupabaseServiceRoleClient()

        // Normalize identifier: strip leading '#', whitespace
        const raw = String(orderIdentifier).trim()
        const ident = raw.startsWith('#') ? raw.slice(1) : raw

        // Resolve order by number first, then by id, and support id prefix
        let order = null

        // Try exact order_number match
        {
            const { data } = await service
                .from("orders")
                .select("*, profiles(email, full_name)")
                .eq("order_number", ident)
                .maybeSingle()
            if (data) order = data
        }

        // Try exact id match
        if (!order) {
            const { data } = await service
                .from("orders")
                .select("*, profiles(email, full_name)")
                .eq("id", ident)
                .maybeSingle()
            if (data) order = data
        }

        // Try id prefix (e.g., first 6-12 chars from UI short id)
        if (!order && ident.length >= 6 && ident.length <= 36) {
            const { data, error } = await service
                .from("orders")
                .select("*, profiles(email, full_name)")
                .ilike("id", `${ident}%`)
                .limit(2)
            if (!error && Array.isArray(data)) {
                if (data.length === 1) order = data[0]
                else if (data.length > 1) {
                    return NextResponse.json({ error: "Multiple orders match this ID prefix. Please provide full Order Number." }, { status: 400 })
                }
            }
        }

        if (!order) {
            return NextResponse.json({ error: "Order not found. Try the full Order Number (e.g., ORD-...)." }, { status: 404 })
        }

        // Get latest OTP tracking entry
        const { data: tracks, error: tErr } = await service
            .from("order_tracking")
            .select("id, status, message, created_at")
            .eq("order_id", order.id)
            .order("created_at", { ascending: false })
            .limit(10)

        if (tErr) {
            return NextResponse.json({ error: "Failed to retrieve tracking" }, { status: 500 })
        }

        const otpTrack = (tracks || []).find((t) => (t.status || "").toLowerCase() === "otp")
        if (!otpTrack) {
            return NextResponse.json({ error: "No OTP found for this order. Mark as Delivered first to generate OTP." }, { status: 400 })
        }

        const extracted = (otpTrack.message || "").match(/\d{4,8}/)?.[0]
        if (!extracted) {
            return NextResponse.json({ error: "Stored OTP is invalid" }, { status: 400 })
        }

        const provided = String(otp).trim()
        if (provided !== extracted) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
        }

        // OTP valid -> confirm delivery. Prefer setting status to 'completed'. Also handle COD -> paid.
        const oldStatus = order.status
        const isCOD = String(order.payment_method || '').toLowerCase().includes('cod') || String(order.payment_method || '').toLowerCase().includes('cash')

        const updatePayload = { status: "completed" }
        if (isCOD) updatePayload.payment_status = "paid"

        const { data: updated, error: upErr } = await service
            .from("orders")
            .update(updatePayload)
            .eq("id", order.id)
            .select("*")
            .maybeSingle()

        let newStatusApplied = null
        if (!upErr && updated) {
            newStatusApplied = "completed"
        } else {
            // Fallback: keep 'delivered'
            newStatusApplied = "delivered"
        }

        // Insert tracking entries
        const inserts = [
            {
                order_id: order.id,
                status: "received",
                message: "Delivery confirmed via OTP by delivery agent."
            },
        ]

        if (newStatusApplied === "completed") {
            inserts.push({ order_id: order.id, status: "completed", message: "Order marked as completed after OTP verification." })
            if (isCOD) {
                inserts.push({ order_id: order.id, status: "payment", message: "Payment collected on delivery. Payment status set to Paid." })
            }
        }

        await service.from("order_tracking").insert(inserts)

        // Email customer about confirmation
        if (order.profiles?.email) {
            try {
                await sendOrderStatusUpdateEmail(order, order.profiles.email, oldStatus, newStatusApplied || oldStatus, { orderItems: [] })
            } catch (e) {
                console.error("Failed to send delivery confirmation email:", e)
            }
        }

        return NextResponse.json({ success: true, status: newStatusApplied, message: "Delivery confirmed" })
    } catch (error) {
        console.error("verify-delivery-otp error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
