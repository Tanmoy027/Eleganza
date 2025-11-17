import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
    try {
        const { productId } = await params
        const supabase = await getSupabaseServerClient()

        // Fetch reviews with user profile info
        const { data: reviewsData, error: reviewsError } = await supabase
            .from('product_reviews')
            .select(`
                *,
                profiles (
                    full_name,
                    email
                )
            `)
            .eq('product_id', productId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError)
            return NextResponse.json({ reviews: [], stats: null, error: reviewsError.message }, { status: 500 })
        }

        // Fetch review statistics
        const { data: statsData, error: statsError } = await supabase
            .from('product_review_stats')
            .select('*')
            .eq('product_id', productId)
            .maybeSingle()

        return NextResponse.json({
            reviews: reviewsData || [],
            stats: statsData || null,
            error: null
        })
    } catch (error) {
        console.error('Exception in reviews API:', error)
        return NextResponse.json({ reviews: [], stats: null, error: error.message }, { status: 500 })
    }
}
