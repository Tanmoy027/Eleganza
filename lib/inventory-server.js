import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"

const normalizeSize = (value) => (value ?? "").toString().trim().toUpperCase()
const normalizeColor = (value) => (value ?? "").toString().trim().toLowerCase()
const makeVariantKey = (productId, size, color) => `${productId}|${normalizeSize(size)}|${normalizeColor(color)}`

export async function adjustInventoryForOrder({ orderId, action, actor }) {
    if (!orderId || !action) {
        return { data: null, error: "orderId and action are required" }
    }

    const service = getSupabaseServiceRoleClient()

    const { data: items, error: itemsError } = await service
        .from("order_items")
        .select("id, product_id, quantity, size, color")
        .eq("order_id", orderId)

    if (itemsError) {
        return { data: null, error: itemsError.message || itemsError }
    }

    if (!items || items.length === 0) {
        return { data: [], error: null }
    }

    const { data: existing } = await service
        .from("inventory_movements")
        .select("id")
        .filter("metadata->>order_id", "eq", orderId)
        .filter("metadata->>action", "eq", action)
        .limit(1)

    if (existing && existing.length > 0) {
        return { data: [], error: null, skipped: true }
    }

    if (action === "restock") {
        const { data: saleMovements } = await service
            .from("inventory_movements")
            .select("id")
            .filter("metadata->>order_id", "eq", orderId)
            .in("movement_type", ["sale", "out", "adjustment"])
            .limit(1)

        if (!saleMovements || saleMovements.length === 0) {
            return { data: [], error: null, skipped: true }
        }
    }

    const productIds = [...new Set(items.map((item) => item.product_id))]
    const { data: variants, error: variantsError } = await service
        .from("product_variants")
        .select("id, product_id, size, color")
        .in("product_id", productIds)

    if (variantsError) {
        return { data: null, error: variantsError.message || variantsError }
    }

    const variantMap = new Map()
        ; (variants || []).forEach((variant) => {
            variantMap.set(makeVariantKey(variant.product_id, variant.size, variant.color), variant.id)
        })

    const movements = []
    const reason = action === "restock" ? "Order cancelled" : "Order placed"

    for (const item of items) {
        const qty = Math.max(0, Number(item.quantity) || 0)
        if (!qty) continue
        const variantId = variantMap.get(makeVariantKey(item.product_id, item.size, item.color))

        if (action === "sale") {
            if (variantId) {
                movements.push({
                    product_id: item.product_id,
                    variant_id: variantId,
                    quantity: qty,
                    movement_type: "sale",
                    reason,
                    metadata: { order_id: orderId, order_item_id: item.id, action, actor }
                })
            } else {
                movements.push({
                    product_id: item.product_id,
                    variant_id: null,
                    quantity: -qty,
                    movement_type: "adjustment",
                    reason: `${reason} (no variant)`,
                    metadata: { order_id: orderId, order_item_id: item.id, action, actor }
                })
            }
        }

        if (action === "restock") {
            movements.push({
                product_id: item.product_id,
                variant_id: variantId || null,
                quantity: qty,
                movement_type: "in",
                reason,
                metadata: { order_id: orderId, order_item_id: item.id, action, actor }
            })
        }
    }

    if (movements.length === 0) {
        return { data: [], error: null }
    }

    const { data, error } = await service
        .from("inventory_movements")
        .insert(movements)
        .select("id")

    if (error) {
        return { data: null, error: error.message || error }
    }

    return { data }
}
