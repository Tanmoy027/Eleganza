import { redirect, notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Package, Download, MapPin, CreditCard, Clock, Truck, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import RealTimeOrderTracking from "@/components/orders/real-time-order-tracking"
import CancelOrderButton from "@/components/orders/cancel-order-button"

export default async function OrderDetailPage({ params }) {
    const supabase = await getSupabaseServerClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch order with all related data
    const { data: order, error: orderError } = await supabase
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
        subtotal,
        product_id
      ),
      order_tracking (
        id,
        status,
        message,
        created_at
      )
    `)
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single()

    if (orderError || !order) {
        notFound()
    }

    const getStatusIcon = (status, isActive = false) => {
        const iconClass = isActive ? "w-5 h-5 text-white" : "w-4 h-4 text-gray-400"
        switch (status?.toLowerCase()) {
            case 'pending':
                return <Clock className={iconClass} />
            case 'confirmed':
            case 'processing':
                return <Package className={iconClass} />
            case 'shipped':
            case 'out_for_delivery':
                return <Truck className={iconClass} />
            case 'delivered':
            case 'completed':
                return <CheckCircle className={iconClass} />
            case 'cancelled':
            case 'refunded':
                return <XCircle className={iconClass} />
            default:
                return <Package className={iconClass} />
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'confirmed':
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'shipped':
            case 'out_for_delivery':
                return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'delivered':
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'cancelled':
            case 'refunded':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const orderStatuses = [
        { key: 'pending', label: 'Order Placed', description: 'We have received your order' },
        { key: 'confirmed', label: 'Order Confirmed', description: 'Your order has been confirmed' },
        { key: 'processing', label: 'Processing', description: 'We are preparing your order' },
        { key: 'shipped', label: 'Shipped', description: 'Your order is on its way' },
        { key: 'delivered', label: 'Delivered', description: 'Your order has been delivered' }
    ]

    const getCurrentStatusIndex = () => {
        const currentStatus = order.status?.toLowerCase()
        return orderStatuses.findIndex(status => status.key === currentStatus)
    }

    const currentStatusIndex = getCurrentStatusIndex()

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <Link
                            href="/orders"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Orders
                        </Link>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Order #{order.order_number || order.id.slice(0, 8)}
                            </h1>
                            <p className="text-gray-600 mt-1">
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
                            <Badge className={`${getStatusColor(order.status)} text-lg px-4 py-2`}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Real-time Order Tracking */}
                        <RealTimeOrderTracking orderId={order.id} initialOrder={order} />

                        {/* Order Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Order Items ({order.order_items?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {order.order_items?.map((item, index) => (
                                        <div key={item.id}>
                                            <div className="flex items-center gap-4 py-4">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                        <span>Qty: {item.quantity}</span>
                                                        {item.size && <span>Size: {item.size}</span>}
                                                        {item.color && <span>Color: {item.color}</span>}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        ${parseFloat(item.product_price || 0).toFixed(2)} each
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">
                                                        ${parseFloat(item.subtotal || 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            {index < order.order_items.length - 1 && <Separator />}
                                        </div>
                                    ))}                                </div>
                            </CardContent>
                        </Card>                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Order Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping:</span>
                                    <span>Free</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax:</span>
                                    <span>$0.00</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                                </div>
                                <div className="pt-2">
                                    <p className="text-sm text-gray-600">Payment Status:</p>
                                    <Badge className={`${order.payment_status === 'paid'
                                        ? 'bg-green-100 text-green-800'
                                        : order.payment_status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        } mt-1`}>
                                        {order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Unknown'}
                                    </Badge>
                                </div>
                                <div className="pt-2">
                                    <p className="text-sm text-gray-600">Payment Method:</p>
                                    <p className="font-medium capitalize mt-1">{order.payment_method || 'Stripe'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping Address */}
                        {order.shipping_address && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Shipping Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm space-y-1">
                                        <p className="font-medium">{order.shipping_address.fullName}</p>
                                        <p>{order.shipping_address.address}</p>
                                        <p>
                                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                                        </p>
                                        {order.shipping_address.phone && (
                                            <p className="pt-2 text-gray-600">Phone: {order.shipping_address.phone}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    {(order.status === 'completed' || order.status === 'delivered') && (<Button className="w-full" variant="outline">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Invoice
                                    </Button>
                                    )}
                                    {order.status === 'pending' && (
                                        <Button className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300" variant="outline">
                                            Cancel Order
                                        </Button>
                                    )}
                                    <Button className="w-full" variant="outline" asChild>
                                        <Link href="/products">
                                            Continue Shopping
                                        </Link>
                                    </Button>
                                </div>            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
