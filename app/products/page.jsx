import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/products/product-card"

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams
  const supabase = await getSupabaseServerClient()

  let query = supabase.from("products").select("*").eq("is_active", true)

  if (params.category) {
    query = query.eq("category", params.category)
  }
  if (params.clothing_type) {
    query = query.eq("clothing_type", params.clothing_type)
  }
  if (params.occasion) {
    query = query.eq("occasion", params.occasion)
  }
  if (params.season) {
    query = query.eq("season", params.season)
  }

  const { data: products } = await query.order("created_at", { ascending: false })

  // Determine the page title and description based on filters
  let pageTitle = "Products"
  let pageDescription = "Browse our collection"

  if (params.season) {
    pageTitle = `${params.season.charAt(0).toUpperCase() + params.season.slice(1)} Collection`
    pageDescription = `Discover our ${params.season} seasonal collection`
  } else if (params.occasion) {
    pageTitle = `${params.occasion.charAt(0).toUpperCase() + params.occasion.slice(1)} Collection`
    pageDescription = `Perfect outfits for ${params.occasion} occasions`
  } else if (params.category) {
    pageTitle = `${params.category.charAt(0).toUpperCase() + params.category.slice(1)}`
    pageDescription = `Browse our ${params.category} collection`
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-4">{pageTitle}</h1>
          <p className="text-gray-600 text-sm tracking-widest uppercase">{pageDescription}</p>

          {/* Active Filters Display */}
          {(params.season || params.occasion || params.category || params.clothing_type) && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-gray-500">Filtered by:</span>
              {params.season && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Season: {params.season}
                </span>
              )}
              {params.occasion && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Occasion: {params.occasion}
                </span>
              )}
              {params.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Category: {params.category}
                </span>
              )}
              {params.clothing_type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Type: {params.clothing_type}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Section */}
      {products && products.length > 0 ? (
        <div className="flex-1 flex justify-center">
          <div className="container mx-auto px-4 pb-12 max-w-7xl">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center container mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {params.season || params.occasion || params.category || params.clothing_type
                ? "Try adjusting your filters or browse all products."
                : "Check back later for new arrivals."}
            </p>
            <a
              href="/products"
              className="inline-block bg-black text-white text-sm font-medium py-2 px-6 rounded-full hover:bg-gray-800 transition-colors"
            >
              Browse All Products
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
