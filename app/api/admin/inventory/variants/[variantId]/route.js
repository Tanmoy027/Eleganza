import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function PATCH(request, { params }) {
    try {
        const { variantId } = await params
        const body = await request.json()

        const supabase = await getSupabaseServerClient()

        // Check if user is admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ data: null, error: 'Not authenticated' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ data: null, error: 'Not authorized' }, { status: 403 })
        }

        // Update the variant
        const { data, error } = await supabase
            .from('product_variants')
            .update(body)
            .eq('id', variantId)
            .select()
            .single()

        if (error) {
            console.error('Error updating variant:', error)
            return NextResponse.json({ data: null, error: error.message }, { status: 500 })
        }

        // If stock_quantity was updated, refresh product aggregates
        if (body.stock_quantity !== undefined && data) {
            try {
                await supabase.rpc('refresh_product_aggregates', { p_id: data.product_id })
            } catch (refreshError) {
                console.warn('Failed to refresh product aggregates:', refreshError)
            }
        }

        return NextResponse.json({ data, error: null })
    } catch (error) {
        console.error('Exception updating variant:', error)
        return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }
}
