import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
    try {
        const { productId } = await params
        const supabase = await getSupabaseServerClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({
                userReview: null,
                hasPurchased: false,
                error: 'Not authenticated'
            }, { status: 401 })
        }

        // Check if user has purchased this product
        let hasPurchased = false
        try {
            const { data: purchaseStatus, error: purchaseError } = await supabase.rpc('has_purchased_product', {
                user_uuid: user.id,
                product_uuid: productId
            })

            if (!purchaseError) {
                hasPurchased = purchaseStatus || false
            }
        } catch (error) {
            console.error('Error checking purchase status:', error)
        }

        // Check if user already has a review for this product
        const { data: existingReview, error: reviewError } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', productId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (reviewError && reviewError.code !== 'PGRST116') {
            console.error('Error fetching user review:', reviewError)
            return NextResponse.json({
                userReview: null,
                hasPurchased,
                error: reviewError.message
            }, { status: 500 })
        }

        return NextResponse.json({
            userReview: existingReview || null,
            hasPurchased,
            error: null
        })
    } catch (error) {
        console.error('Exception in user review API:', error)
        return NextResponse.json({
            userReview: null,
            hasPurchased: false,
            error: error.message
        }, { status: 500 })
    }
}
