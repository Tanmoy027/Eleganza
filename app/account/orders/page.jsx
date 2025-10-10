import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Package, Eye, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function OrdersPage() {
    const supabase = await getSupabaseServerClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch all user orders with order items
    const { data: orders } = await supabase
        .from("orders")
        .select(`
      *,
      order_items (
        id,
        product_name,
        product_price,
        quantity,
        size,
        color,
        subtotal
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link
                        href="/account"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Account
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                    <p className="text-gray-600 mt-2">View and track all your orders</p>
                </div>

                {orders && orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <Card key={order.id} className="overflow-hidden">
                                <CardHeader className="bg-white border-b">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">
                                                Order #{order.order_number || order.id.slice(0, 8)}
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Placed on {new Date(order.created_at).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-gray-900">
                                                ${parseFloat(order.total_amount || 0).toFixed(2)}
                                            </p>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'completed' || order.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : order.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : order.status === 'processing'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : order.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-600">Payment Status:</span>
                                                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${order.payment_status === 'paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : order.payment_status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Unknown'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Payment Method:</span>
                                                <span className="ml-2 capitalize">
                                                    {order.payment_method || 'Stripe'}
                                                </span>
                                            </div>
                                        </div>

                                        {order.shipping_address && (
                                            <div>
                                                <span className="font-medium text-gray-600">Shipping Address:</span>
                                                <div className="mt-1 text-sm text-gray-900">
                                                    <p>{order.shipping_address.fullName}</p>
                                                    <p>{order.shipping_address.address}</p>
                                                    <p>
                                                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                                                    </p>
                                                    {order.shipping_address.phone && <p>Phone: {order.shipping_address.phone}</p>}
                                                </div>
                                            </div>
                                        )}

                                        {order.order_items && order.order_items.length > 0 && (
                                            <div>
                                                <span className="font-medium text-gray-600 block mb-2">Order Items:</span>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    {order.order_items.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{item.product_name}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    Qty: {item.quantity}
                                                                    {item.size && ` • Size: ${item.size}`}
                                                                    {item.color && ` • Color: ${item.color}`}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-medium text-gray-900">
                                                                    ${parseFloat(item.subtotal || 0).toFixed(2)}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    ${parseFloat(item.product_price || 0).toFixed(2)} each
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-4 border-t">
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </Button>
                                            {order.status === 'completed' && (
                                                <Button variant="outline" size="sm">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Invoice
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                            <p className="text-gray-500 mb-6">
                                When you place your first order, it will appear here.
                            </p>
                            <Button asChild>
                                <Link href="/products">Start Shopping</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
