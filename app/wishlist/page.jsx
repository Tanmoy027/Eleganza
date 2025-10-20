import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Heart, ShoppingBag } from "lucide-react"
import Image from "next/image"
import { getProductMainImage, handleImageError } from "@/lib/image-utils"

export default async function WishlistPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch wishlist items with product details
  const { data: wishlistItems } = await supabase
    .from("wishlist")
    .select(`
      id,
      created_at,
      products (
        id,
        name,
        price,
        image_url,
        category
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistItems?.length || 0} {wishlistItems?.length === 1 ? "item" : "items"}
          </p>
        </div>

        {wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden group">
                <Link href={`/products/${item.products.id}`}>
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={getProductMainImage(item.products)}
                      alt={item.products.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={handleImageError}
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/products/${item.products.id}`}>
                    <h3 className="font-medium mb-1 hover:text-gray-600 transition-colors">{item.products.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-600 mb-2 capitalize">{item.products.category}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">৳{item.products.price}</p>
                    <button className="flex items-center space-x-1 text-sm bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Save your favorite items here to easily find them later</p>
            <Link
              href="/"
              className="inline-block bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
