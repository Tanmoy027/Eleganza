import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function PATCH(request, { params }) {
    try {
        const { productId } = await params
        const { percentage } = await request.json()

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

        // Update product discount
        const { data, error } = await supabase
            .from('products')
            .update({
                discount_percentage: percentage,
                is_on_discount: percentage > 0
            })
            .eq('id', productId)
            .select()

        if (error) {
            console.error('Error setting product discount:', error)
            return NextResponse.json({ data: null, error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data, error: null })
    } catch (error) {
        console.error('Exception setting product discount:', error)
        return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }
}
