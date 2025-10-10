import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/products/product-card"

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams
  const supabase = await getSupabaseServerClient()

  let query = supabase.from("products").select("*").eq("is_active", true)

  if (params.category) {
    query = query.eq("category", params.category)
  }
  if (params.occasion) {
    query = query.eq("occasion", params.occasion)
  }
  if (params.season) {
    query = query.eq("season", params.season)
  }

  const { data: products } = await query.order("created_at", { ascending: false })

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Browse our collection</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
