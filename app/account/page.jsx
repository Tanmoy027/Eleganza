import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { signOut } from "@/lib/auth"
import Link from "next/link"
import { User, Package, Heart, Settings, LogOut, ShoppingCart, Shield } from "lucide-react"

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch user orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  async function handleLogout() {
    "use server"
    await signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your account settings and view your order history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 sticky top-24">
              <div className="flex items-center space-x-3 pb-4 border-b">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {profile?.full_name
                    ? profile.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                    : user.email?.charAt(0).toUpperCase() || <User className="w-7 h-7" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {profile?.full_name || user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    {profile?.role === "admin" && <Shield className="w-3 h-3" />}
                    {profile?.role === "admin" ? "Administrator" : "Customer"}
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                {profile?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all font-medium"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center space-x-3 px-4 py-3 bg-gray-50 text-gray-900 rounded-lg font-medium"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>My Cart</span>
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Package className="w-5 h-5" />
                  <span>Orders</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
                <div className="pt-2 border-t">
                  <form action={handleLogout}>
                    <button
                      type="submit"
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-lg transition-colors text-red-600 font-medium"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </form>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{orders?.length || 0}</div>
                <div className="text-sm text-gray-600 font-medium">Total Orders</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  $
                  {orders?.reduce((sum, order) => sum + (Number.parseFloat(order.total_amount) || 0), 0).toFixed(2) ||
                    "0.00"}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Spent</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                    {profile?.role === "admin" ? (
                      <Shield className="w-6 h-6 text-white" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {profile?.role === "admin" ? "Admin" : "Member"}
                </div>
                <div className="text-sm text-gray-600 font-medium">Account Status</div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Account Details</h2>
                <Link
                  href="/account/settings"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Edit Profile
                </Link>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                    <p className="font-medium text-gray-900 mt-2 text-lg">{profile?.full_name || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="font-medium text-gray-900 mt-2 text-lg">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account Type</label>
                    <p className="font-medium text-gray-900 capitalize mt-2 text-lg">
                      {profile?.role === "admin" ? "Administrator" : "Customer"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Member Since</label>
                    <p className="font-medium text-gray-900 mt-2 text-lg">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {profile?.phone && (
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="font-medium text-gray-900 mt-2 text-lg">{profile.phone}</p>
                  </div>
                )}
                {(profile?.address_line_1 || profile?.city || profile?.state || profile?.postal_code) && (
                  <div>
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</label>
                    <div className="font-medium text-gray-900 mt-2 text-lg">
                      {profile.address_line_1 && <p>{profile.address_line_1}</p>}
                      {profile.address_line_2 && <p>{profile.address_line_2}</p>}
                      {(profile.city || profile.state || profile.postal_code) && (
                        <p>
                          {profile.city && `${profile.city}, `}
                          {profile.state && `${profile.state} `}
                          {profile.postal_code}
                        </p>
                      )}
                      {profile.country && <p>{profile.country}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <Link
                  href="/account/orders"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  View All
                </Link>
              </div>
              {orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-gray-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-lg">
                            ৳{Number.parseFloat(order.total_amount || 0).toFixed(2)}
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">No orders yet</p>
                  <p className="text-sm text-gray-500 mb-4">Start shopping to see your orders here</p>
                  <Link
                    href="/"
                    className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
