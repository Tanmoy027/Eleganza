import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ProductDetails } from "@/components/products/product-details"

export default async function ProductDetailsPage({ params }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: product } = await supabase.from("products").select("*").eq("id", id).eq("is_active", true).single()

  if (!product) {
    notFound()
  }

  // Get similar products from the same category
  const { data: similarProducts } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .eq("is_active", true)
    .neq("id", id)
    .limit(4)
    .order("created_at", { ascending: false })

  // Get real reviews for this product
  const { data: reviews } = await supabase
    .from("product_reviews")
    .select(`
      *,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq("product_id", id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  return <ProductDetails product={product} similarProducts={similarProducts || []} reviews={reviews || []} />
}
