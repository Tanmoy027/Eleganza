// filepath: f:\\web development\\24 project\\apu\\new version\\shuvaapumain\\lib\\inventory.js
import { getSupabaseBrowserClient } from "./supabase/client"

// Client-side: fetch variants for a product
export async function getProductVariants(productId) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("color", { ascending: true })
        .order("size", { ascending: true })

    return { data: data || [], error }
}

// Client-side: upsert variants (admin only)
export async function upsertProductVariants(variants) {
    const supabase = getSupabaseBrowserClient()
    // Remove id to prevent PK conflicts on upsert
    const payload = variants.map(v => ({
        product_id: v.product_id,
        color: v.color ?? null,
        size: v.size ?? null,
        sku: v.sku ?? null,
        stock_quantity: v.stock_quantity ?? 0,
        reserved_quantity: v.reserved_quantity ?? 0,
        restock_threshold: v.restock_threshold ?? 5,
        is_active: v.is_active !== false
    }))
    const { data, error } = await supabase
        .from("product_variants")
        .upsert(payload, { onConflict: "product_id,color,size" })
        .select()

    return { data, error }
}

// Client-side: update single variant
export async function updateVariant(id, patch) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
        .from("product_variants")
        .update(patch)
        .eq("id", id)
        .select()
        .single()
    return { data, error }
}

// Client-side: record inventory movement (for audit) and adjust stock via triggers
export async function recordInventoryMovement({ product_id, variant_id, quantity, movement_type, reason, metadata }) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
        .from("inventory_movements")
        .insert([{ product_id, variant_id, quantity, movement_type, reason, metadata }])
        .select()

    return { data, error }
}

// View for admin overview
export async function getInventoryStatus({ onlyNeedsRestock = false } = {}) {
    const supabase = getSupabaseBrowserClient()
    let query = supabase.from("inventory_status").select("*")
    if (onlyNeedsRestock) query = query.eq("needs_restock", true)
    const { data, error } = await query.order("product_name", { ascending: true })
    return { data: data || [], error }
}

// Apply stale inventory discounts (admin)
export async function applyStaleInventoryDiscounts({ default_percentage = 15, days_without_sale = 30 } = {}) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.rpc("apply_stale_inventory_discounts", {
        default_percentage,
        days_without_sale,
    })
    return { data, error }
}

// Set discount for a single product (admin)
export async function setProductDiscount(productId, percentage) {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
        .from('products')
        .update({ discount_percentage: percentage, is_on_discount: percentage > 0 })
        .eq('id', productId)
        .select()
    return { data, error }
}

// Sync variants for a product so that every size/color combo exists and share uniform stock
export async function syncVariantsUniformStock(productId, uniformStock) {
    // Server route performs this securely with admin privileges
    const res = await fetch('/api/admin/inventory/sync-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, uniformStock })
    })
    const json = await res.json()
    if (!res.ok) {
        return { error: { message: json.error || 'Failed to sync variants' } }
    }
    return { data: json }
}

// Utility: compute availability map from variants
export function buildAvailabilityMaps(variants = []) {
    const byColor = new Map()
    const bySize = new Map()
    const byKey = new Map()

    for (const v of variants) {
        const color = (v.color || '').toLowerCase()
        const size = (v.size || '').toUpperCase()
        const key = `${color}__${size}`
        byKey.set(key, v)

        if (!byColor.has(color)) byColor.set(color, new Map())
        if (!bySize.has(size)) bySize.set(size, new Map())

        byColor.get(color).set(size, v.stock_quantity || 0)
        bySize.get(size).set(color, v.stock_quantity || 0)
    }

    return { byColor, bySize, byKey }
}
