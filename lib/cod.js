import { getSupabaseBrowserClient } from "./supabase/client"
import { clearCart } from "./cart"

export async function placeCodOrder(cartItems, shippingAddress, total) {
    try {
        const supabase = getSupabaseBrowserClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            throw new Error("User not authenticated")
        }

        const orderNumber = `ORD-${Date.now()}`

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert([
                {
                    user_id: user.id,
                    order_number: orderNumber,
                    total_amount: total,
                    shipping_address: shippingAddress,
                    payment_method: "cod",
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

        // Clear cart after creating the order
        await clearCart()

        return { order }
    } catch (error) {
        console.error("Error placing COD order:", error)
        return { error }
    }
}
