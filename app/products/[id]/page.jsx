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

  return <ProductDetails product={product} />
}
