import { getSupabaseBrowserClient } from "./supabase/client"

export async function createGiftCheckoutSession(cartItems, giftInfo, total) {
    try {
        const supabase = getSupabaseBrowserClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("User not authenticated")

        const orderNumber = `ORD-${Date.now()}`

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert([
                {
                    user_id: user.id,
                    order_number: orderNumber,
                    total_amount: total,
                    shipping_address: giftInfo,
                    payment_method: "stripe",
                    status: "pending",
                    payment_status: "pending",
                },
            ])
            .select()
            .single()

        if (orderError) throw orderError

        const orderItems = cartItems.map((item) => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.products.name,
            product_price: item.products.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            subtotal: Number(item.products.price) * item.quantity,
        }))

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
        if (itemsError) throw itemsError

        // Adjust inventory immediately after order creation
        try {
            const adjustResponse = await fetch("/api/orders/adjust-inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id, action: "sale" }),
            })

            const adjustResult = await adjustResponse.json()
            if (!adjustResponse.ok) {
                console.error("Inventory adjustment failed:", adjustResult.error)
            }
        } catch (adjustError) {
            console.error("Inventory adjustment error:", adjustError)
        }

        // Create Stripe checkout session via API, marking as gift
        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id, cartItems, total, shippingAddress: giftInfo, isGift: true }),
        })

        const data = await response.json()

        if (!response.ok) throw new Error(data.error || "Failed to create gift checkout session")

        return { sessionId: data.sessionId }
    } catch (error) {
        console.error("Error creating gift checkout session:", error)
        return { error: error.message }
    }
}
