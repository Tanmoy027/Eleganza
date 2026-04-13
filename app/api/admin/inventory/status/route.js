import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const onlyNeedsRestock = searchParams.get('onlyNeedsRestock') === 'true'

        const supabase = await getSupabaseServerClient()

        // Check if user is admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ data: [], error: 'Not authenticated' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ data: [], error: 'Not authorized' }, { status: 403 })
        }

        // Fetch ALL products first with sizes and colors
        const { data: allProducts, error: productsError } = await supabase
            .from('products')
            .select('id, name, is_active, is_on_discount, discount_percentage, stock_quantity, sizes, colors')
            .order('name', { ascending: true })

        if (productsError) {
            console.error('Error fetching products:', productsError)
            return NextResponse.json({ data: [], error: productsError.message }, { status: 500 })
        }

        // Fetch ALL variants for these products (including inactive ones)
        const { data: variantsData, error: variantsError } = await supabase
            .from('product_variants')
            .select('*')
            .order('product_id', { ascending: true })

        if (variantsError) {
            console.error('Error fetching variants:', variantsError)
            return NextResponse.json({ data: [], error: variantsError.message }, { status: 500 })
        }

        // Create a map of variants by product_id
        const variantsByProduct = {}
        if (variantsData && variantsData.length > 0) {
            variantsData.forEach(v => {
                if (!variantsByProduct[v.product_id]) {
                    variantsByProduct[v.product_id] = []
                }
                variantsByProduct[v.product_id].push(v)
            })
        }

        // Compute reserved quantities from open orders
        const normalizeSize = (value) => (value ?? '').toString().trim().toUpperCase()
        const normalizeColor = (value) => (value ?? '').toString().trim().toLowerCase()
        const makeVariantKey = (productId, size, color) => `${productId}|${normalizeSize(size)}|${normalizeColor(color)}`

        const variantKeyToId = new Map()
        if (variantsData && variantsData.length > 0) {
            variantsData.forEach(v => {
                variantKeyToId.set(makeVariantKey(v.product_id, v.size, v.color), v.id)
            })
        }

        const reservedByVariantId = new Map()
        const reservedByProductId = new Map()

        const openStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
        const { data: openOrders, error: openOrdersError } = await supabase
            .from('orders')
            .select('id,status')
            .in('status', openStatuses)

        if (openOrdersError) {
            console.error('Error fetching open orders:', openOrdersError)
        }

        const orderIds = (openOrders || []).map(o => o.id)
        if (orderIds.length > 0) {
            const { data: orderItems, error: orderItemsError } = await supabase
                .from('order_items')
                .select('order_id, product_id, size, color, quantity')
                .in('order_id', orderIds)

            if (orderItemsError) {
                console.error('Error fetching open order items:', orderItemsError)
            } else {
                ; (orderItems || []).forEach(item => {
                    const qty = Number(item.quantity) || 0
                    if (!qty) return
                    const key = makeVariantKey(item.product_id, item.size, item.color)
                    const variantId = variantKeyToId.get(key)

                    if (variantId) {
                        reservedByVariantId.set(variantId, (reservedByVariantId.get(variantId) || 0) + qty)
                    } else {
                        reservedByProductId.set(item.product_id, (reservedByProductId.get(item.product_id) || 0) + qty)
                    }
                })
            }
        }

        // Build inventory data - include ALL products
        let data = []
        allProducts.forEach(product => {
            const variants = variantsByProduct[product.id] || []
            const sizes = product.sizes || []
            const colors = product.colors || []

            if (variants.length > 0) {
                // Product has variants in DB - show each variant
                variants.forEach(v => {
                    data.push({
                        variant_id: v.id,
                        product_id: product.id,
                        product_name: product.name,
                        color: v.color,
                        size: v.size,
                        stock_quantity: v.stock_quantity,
                        reserved_quantity: Math.max(reservedByVariantId.get(v.id) || 0, v.reserved_quantity ?? 0),
                        restock_threshold: v.restock_threshold,
                        needs_restock: v.stock_quantity <= v.restock_threshold,
                        last_sold_at: v.last_sold_at,
                        product_active: product.is_active,
                        is_on_discount: product.is_on_discount,
                        discount_percentage: product.discount_percentage
                    })
                })
            } else if (sizes.length > 0 || colors.length > 0) {
                // Product has sizes/colors defined but no variants created yet
                // Show expected combinations
                const combos = []
                if (sizes.length === 0 && colors.length > 0) {
                    colors.forEach(c => combos.push({ size: null, color: c }))
                } else if (colors.length === 0 && sizes.length > 0) {
                    sizes.forEach(s => combos.push({ size: s, color: null }))
                } else if (sizes.length > 0 && colors.length > 0) {
                    sizes.forEach(s => colors.forEach(c => combos.push({ size: s, color: c })))
                }

                combos.forEach(combo => {
                    data.push({
                        variant_id: null,
                        product_id: product.id,
                        product_name: product.name,
                        color: combo.color,
                        size: combo.size,
                        stock_quantity: 0,
                        reserved_quantity: reservedByProductId.get(product.id) || 0,
                        restock_threshold: 5,
                        needs_restock: true,
                        last_sold_at: null,
                        product_active: product.is_active,
                        is_on_discount: product.is_on_discount,
                        discount_percentage: product.discount_percentage
                    })
                })
            } else {
                // Product has NO sizes/colors and NO variants
                data.push({
                    variant_id: null,
                    product_id: product.id,
                    product_name: product.name,
                    color: null,
                    size: null,
                    stock_quantity: product.stock_quantity || 0,
                    reserved_quantity: reservedByProductId.get(product.id) || 0,
                    restock_threshold: 5,
                    needs_restock: (product.stock_quantity || 0) <= 5,
                    last_sold_at: null,
                    product_active: product.is_active,
                    is_on_discount: product.is_on_discount,
                    discount_percentage: product.discount_percentage
                })
            }
        })

        if (onlyNeedsRestock) {
            data = data.filter(item => item.needs_restock)
        }

        return NextResponse.json({ data: data || [], error: null })
    } catch (error) {
        console.error('Exception fetching inventory status:', error)
        return NextResponse.json({ data: [], error: error.message }, { status: 500 })
    }
}
