import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Package, ShoppingCart, LayoutDashboard, MessageSquare } from "lucide-react"

export default async function AdminLayout({ children }) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/admin"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>Products</span>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Orders</span>
            </Link>
            <Link
              href="/admin/reviews"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Reviews</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
