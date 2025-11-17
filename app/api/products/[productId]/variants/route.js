import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
    try {
        const { productId } = await params
        const supabase = await getSupabaseServerClient()

        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .eq('is_active', true)
            .order('color', { ascending: true })
            .order('size', { ascending: true })

        if (error) {
            console.error('Error fetching product variants:', error)
            return NextResponse.json({ data: [], error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data: data || [], error: null })
    } catch (error) {
        console.error('Exception fetching product variants:', error)
        return NextResponse.json({ data: [], error: error.message }, { status: 500 })
    }
}
