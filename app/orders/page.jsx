import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Package, Eye, Download, Truck, Clock, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function OrdersPage() {
    const supabase = await getSupabaseServerClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch all user orders with order items and tracking information
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
      ),
      order_tracking (
        id,
        status,
        message,
        created_at
      )
    `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return <Clock className="w-4 h-4" />
            case 'confirmed':
            case 'processing':
                return <Package className="w-4 h-4" />
            case 'shipped':
            case 'out_for_delivery':
                return <Truck className="w-4 h-4" />
            case 'delivered':
            case 'completed':
                return <CheckCircle className="w-4 h-4" />
            case 'cancelled':
            case 'refunded':
                return <XCircle className="w-4 h-4" />
            default:
                return <Package className="w-4 h-4" />
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'confirmed':
            case 'processing':
                return 'bg-blue-100 text-blue-800'
            case 'shipped':
            case 'out_for_delivery':
                return 'bg-purple-100 text-purple-800'
            case 'delivered':
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
            case 'refunded':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link
                            href="/account"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Account
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                    <p className="text-gray-600 mt-2">Track your orders and view order history</p>
                </div>

                {orders && orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <Card key={order.id} className="overflow-hidden">
                                <CardHeader className="bg-white border-b">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {getStatusIcon(order.status)}
                                                Order #{order.order_number || order.id.slice(0, 8)}
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Placed on {new Date(order.created_at).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-gray-900">
                                                ৳{parseFloat(order.total_amount || 0).toFixed(2)}
                                            </p>
                                            <Badge className={`${getStatusColor(order.status)} mt-1`}>
                                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        {/* Order Status and Payment Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-600">Payment Status:</span>
                                                <Badge className={`ml-2 ${order.payment_status === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : order.payment_status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Unknown'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Payment Method:</span>
                                                <span className="ml-2 capitalize">
                                                    {order.payment_method || 'Stripe'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Items:</span>
                                                <span className="ml-2">
                                                    {order.order_items?.length || 0} item(s)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Shipping Address */}
                                        {order.shipping_address && (
                                            <div>
                                                <span className="font-medium text-gray-600">Shipping Address:</span>
                                                <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                                    <p className="font-medium">{order.shipping_address.fullName}</p>
                                                    <p>{order.shipping_address.address}</p>
                                                    <p>
                                                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                                                    </p>
                                                    {order.shipping_address.phone && <p>Phone: {order.shipping_address.phone}</p>}
                                                </div>
                                            </div>
                                        )}

                                        {/* Order Items */}
                                        {order.order_items && order.order_items.length > 0 && (
                                            <div>
                                                <span className="font-medium text-gray-600 block mb-3">Order Items:</span>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    {order.order_items.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
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
                                                                    ৳{parseFloat(item.subtotal || 0).toFixed(2)}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    ৳{parseFloat(item.product_price || 0).toFixed(2)} each
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Order Tracking Timeline */}
                                        {order.order_tracking && order.order_tracking.length > 0 && (
                                            <div>
                                                <span className="font-medium text-gray-600 block mb-3">Order Tracking:</span>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="space-y-3">
                                                        {order.order_tracking
                                                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                                            .map((track, index) => (
                                                                <div key={track.id} className="flex items-start gap-3">
                                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${index === 0 ? 'bg-blue-600' : 'bg-gray-400'
                                                                        }`}>
                                                                        {getStatusIcon(track.status)}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="font-medium text-gray-900 capitalize">
                                                                                {track.status?.replace('_', ' ') || track.message}
                                                                            </p>
                                                                            <p className="text-sm text-gray-500">
                                                                                {new Date(track.created_at).toLocaleDateString("en-US", {
                                                                                    month: "short",
                                                                                    day: "numeric",
                                                                                    hour: "2-digit",
                                                                                    minute: "2-digit"
                                                                                })}
                                                                            </p>
                                                                        </div>
                                                                        {track.message && track.message !== track.status && (
                                                                            <p className="text-sm text-gray-600 mt-1">{track.message}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-4 border-t">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/orders/${order.id}`}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Details
                                                </Link>
                                            </Button>
                                            {(order.status === 'completed' || order.status === 'delivered') && (
                                                <Button variant="outline" size="sm">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Invoice
                                                </Button>
                                            )}
                                            {order.status === 'pending' && (
                                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                    Cancel Order
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
                                When you place your first order, it will appear here with real-time tracking updates.
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
