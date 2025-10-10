import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth";
import Link from "next/link";
import { User, Package, Heart, Settings, LogOut, ShoppingCart, Shield } from "lucide-react";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  async function handleLogout() {
    "use server";
    await signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and view your order history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="flex items-center space-x-3 pb-4 border-b">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {profile?.full_name ?
                    profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                    user.email?.charAt(0).toUpperCase() || <User className="w-6 h-6" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-900">{profile?.full_name || user.email?.split('@')[0] || 'User'}</p>
                  <p className="text-sm text-gray-500">{profile?.role === "admin" ? "Administrator" : "Customer"}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {profile?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <Link href="/account" className="flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded-lg">
                  <User className="w-5 h-5 text-gray-700" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  <span>My Cart</span>
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Package className="w-5 h-5 text-gray-700" />
                  <span>Orders</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Heart className="w-5 h-5 text-gray-700" />
                  <span>Wishlist</span>
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-700" />
                  <span>Settings</span>
                </Link>
                <div className="pt-2 border-t">
                  <form action={handleLogout}>
                    <button
                      type="submit"
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
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
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-gray-900">{orders?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  ${orders?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0).toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  {profile?.role === 'admin' ?
                    <Shield className="w-5 h-5 text-purple-600" /> :
                    <User className="w-5 h-5 text-purple-600" />
                  }
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {profile?.role === 'admin' ? 'Admin' : 'Member'}
                </div>
                <div className="text-sm text-gray-600">Account Status</div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>
                <Link
                  href="/account/settings"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit Profile
                </Link>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="font-medium text-gray-900 mt-1">
                      {profile?.full_name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="font-medium text-gray-900 mt-1">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Account Type</label>
                    <p className="font-medium text-gray-900 capitalize mt-1">
                      {profile?.role === "admin" ? "Administrator" : "Customer"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Member Since</label>
                    <p className="font-medium text-gray-900 mt-1">
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
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="font-medium text-gray-900 mt-1">{profile.phone}</p>
                  </div>
                )}
                {(profile?.address_line_1 || profile?.city || profile?.state || profile?.postal_code) && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <div className="font-medium text-gray-900 mt-1">
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
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">
                  View All
                </Link>
              </div>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${parseFloat(order.total_amount || 0).toFixed(2)}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No orders yet</p>
                  <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
