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
    const { data, error } = await supabase
        .from("product_variants")
        .upsert(variants, { onConflict: "product_id,color,size" })
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

// Utility: compute availability map from variants
export function buildAvailabilityMaps(variants = []) {
    const byColor = new Map()
    const bySize = new Map()
    const byKey = new Map()

    for (const v of variants) {
        const k = `${(v.color || '').toLowerCase()}__${(v.size || '').toUpperCase()}`
        byKey.set(k, v)

        if (!byColor.has((v.color || '').toLowerCase())) byColor.set((v.color || '').toLowerCase(), new Map())
        if (!bySize.has((v.size || '').toUpperCase())) bySize.set((v.size || '').toUpperCase(), new Map())

        byColor.get((v.color || '').toLowerCase()).set((v.size || '').toUpperCase(), v.stock_quantity)
        bySize.get((v.size || '').toUpperCase()).set((v.color || '').toLowerCase(), v.stock_quantity)
    }

    return { byColor, bySize, byKey }
}
