import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"
import { adjustInventoryForOrder } from "@/lib/inventory-server"

export async function POST(request) {
    try {
        const { orderId, action } = await request.json()

        if (!orderId || !action) {
            return NextResponse.json({ error: "orderId and action are required" }, { status: 400 })
        }

        if (!['sale', 'restock'].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        const supabase = await getSupabaseServerClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        const isAdmin = profile?.role === "admin"

        if (!isAdmin) {
            const service = getSupabaseServiceRoleClient()
            const { data: order } = await service
                .from("orders")
                .select("id, user_id")
                .eq("id", orderId)
                .single()

            if (!order || order.user_id !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        const { data, error, skipped } = await adjustInventoryForOrder({
            orderId,
            action,
            actor: isAdmin ? "admin" : "customer"
        })

        if (error) {
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json({ success: true, skipped: !!skipped, data: data || [] })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
