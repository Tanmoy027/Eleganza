// filepath: f:\\web development\\24 project\\apu\\new version\\shuvaapumain\\app\\api\\admin\\inventory\\sync-variants\\route.js
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req) {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

    const { productId, uniformStock } = await req.json()
    if (!productId) return new Response(JSON.stringify({ error: 'Missing productId' }), { status: 400 })

    // Fetch product sizes/colors
    const { data: product, error: pErr } = await supabase.from('products').select('id, sizes, colors').eq('id', productId).single()
    if (pErr || !product) return new Response(JSON.stringify({ error: pErr?.message || 'Product not found' }), { status: 404 })

    const sizes = product.sizes || []
    const colors = product.colors || []

    // Build list of combinations; if no sizes/colors, create single NULL/NULL
    const combos = []
    if ((sizes?.length || 0) === 0 && (colors?.length || 0) === 0) {
        combos.push({ size: null, color: null })
    } else if ((colors?.length || 0) === 0) {
        sizes.forEach(s => combos.push({ size: s, color: null }))
    } else if ((sizes?.length || 0) === 0) {
        colors.forEach(c => combos.push({ size: null, color: c }))
    } else {
        sizes.forEach(s => colors.forEach(c => combos.push({ size: s, color: c })))
    }

    // Upsert variants for all combos with the provided uniform stock
    const rows = combos.map(c => ({
        product_id: product.id,
        size: c.size,
        color: c.color,
        stock_quantity: typeof uniformStock === 'number' ? Math.max(0, uniformStock) : undefined,
        is_active: true
    }))

    const { data, error } = await supabase.from('product_variants').upsert(rows, { onConflict: 'product_id,color,size' }).select()
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ count: data?.length || 0 }), { status: 200 })
}
