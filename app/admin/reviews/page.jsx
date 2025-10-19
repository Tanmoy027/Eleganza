import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AdminReviewsClient } from "@/components/admin/admin-reviews-client"

export default async function AdminReviewsPage() {
    const supabase = await getSupabaseServerClient()

    // Fetch all reviews with product and user information
    const { data: reviews } = await supabase
        .from("product_reviews")
        .select(`
      *,
      products (
        id,
        name,
        image_url
      ),
      profiles (
        id,
        full_name,
        email
      )
    `)
        .order("created_at", { ascending: false })

    // Fetch review statistics
    const { data: stats } = await supabase
        .from("product_review_stats")
        .select("*")
        .order("total_reviews", { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Review Management</h1>
                <p className="text-gray-600 mt-2">Manage customer reviews and ratings</p>
            </div>

            <AdminReviewsClient
                initialReviews={reviews || []}
                initialStats={stats || []}
            />
        </div>
    )
}
