import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ProductDetails } from "@/components/products/product-details"
import { notFound } from "next/navigation"

export default async function ProductPage({ params }) {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    // Get the main product
    const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single()

    if (error || !product) {
        notFound()
    }    // Get similar products from the same category
    const { data: similarProducts } = await supabase
        .from("products")
        .select("*")
        .eq("category", product.category)
        .eq("is_active", true)
        .neq("id", id)
        .limit(4)
        .order("created_at", { ascending: false })

    // Get reviews for this product
    const { data: reviews } = await supabase
        .from("product_reviews")
        .select(`
            *,
            profiles:user_id (
                full_name,
                avatar_url
            )
        `)
        .eq("product_id", id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(50)

    return <ProductDetails product={product} similarProducts={similarProducts || []} reviews={reviews || []} />
}

export async function generateMetadata({ params }) {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { data: product } = await supabase
        .from("products")
        .select("name, description")
        .eq("id", id)
        .single()

    if (!product) {
        return {
            title: "Product Not Found",
        }
    }

    return {
        title: product.name,
        description: product.description,
    }
}
