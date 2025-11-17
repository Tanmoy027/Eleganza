import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const clothing_type = searchParams.get('clothing_type')
        const occasion = searchParams.get('occasion')
        const season = searchParams.get('season')
        const is_on_discount = searchParams.get('is_on_discount')

        const supabase = await getSupabaseServerClient()
        let query = supabase
            .from('products')
            .select('*')
            .eq('is_active', true)

        if (category) {
            query = query.eq('category', category)
        }
        if (clothing_type) {
            query = query.eq('clothing_type', clothing_type)
        }
        if (occasion) {
            query = query.eq('occasion', occasion)
        }
        if (season) {
            query = query.eq('season', season)
        }
        if (is_on_discount === 'true') {
            query = query.eq('is_on_discount', true)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching products:', error)
            return NextResponse.json({ data: [], error: error.message }, { status: 500 })
        }

        // Fetch variants for all products to calculate total stock
        const productsWithStock = await Promise.all(
            (data || []).map(async (product) => {
                const { data: variants } = await supabase
                    .from('product_variants')
                    .select('stock_quantity')
                    .eq('product_id', product.id)
                    .eq('is_active', true)

                // Calculate total stock from all variants
                const totalStock = variants?.reduce((sum, variant) => sum + (variant.stock_quantity || 0), 0) || 0

                return {
                    ...product,
                    stock_quantity: totalStock
                }
            })
        )

        const response = NextResponse.json({ data: productsWithStock, error: null })

        // Add cache control headers to prevent stale data
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

        return response
    } catch (error) {
        console.error('Exception fetching products:', error)
        return NextResponse.json({ data: [], error: error.message }, { status: 500 })
    }
}
