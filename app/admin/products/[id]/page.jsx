import { notFound } from "next/navigation"
import ProductForm from "@/components/admin/product-form"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function EditProductPage({ params }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single()

  if (!product) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  )
}
