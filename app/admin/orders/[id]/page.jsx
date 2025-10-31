import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import OrderStatusUpdate from "@/components/admin/order-status-update"

// Add revalidation to ensure fresh data
export const revalidate = 0

export default async function OrderDetailPage({ params }) {
  const { id } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const { data: order } = await supabase
    .from("orders")
    .select("*, profiles(full_name, email)")
    .eq("id", id)
    .single()

  if (!order) {
    notFound()
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*, products(name, image_url)")
    .eq("order_id", id)

  const { data: tracking } = await supabase
    .from("order_tracking")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false })

  const addr = order?.shipping_address || {}
  const isGift = !!addr?.recipientName

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        Order Details
        {isGift && <Badge variant="secondary">Gift</Badge>}
      </h1>

      {/* Order Status Update */}
      <OrderStatusUpdate orderId={id} currentStatus={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-medium">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge>{order.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>{order.payment_status}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-medium">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Stripe'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-medium text-lg">৳{Number(order.total_amount || 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Customer / Address Info */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <div>
                <p className="font-medium">{order.profiles?.full_name || "N/A"}</p>
                <p className="text-sm text-gray-600">{order.profiles?.email || "N/A"}</p>
              </div>
            </div>

            {!isGift && (
              <div>
                <p className="text-sm text-gray-600">Shipping Address</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                  {typeof order.shipping_address === 'object' ? (
                    <>
                      <p className="font-medium">{addr.fullName}</p>
                      <p>{addr.address}</p>
                      <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                      {addr.phone && <p>Phone: {addr.phone}</p>}
                    </>
                  ) : (
                    <p className="font-medium">{order.shipping_address}</p>
                  )}
                </div>
              </div>
            )}

            {isGift && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Recipient</p>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium">{addr.recipientName}</p>
                    <p>{addr.recipientAddress}</p>
                    <p>{addr.recipientCity}, {addr.recipientState} {addr.recipientZip}</p>
                    {addr.recipientPhone && <p>Phone: {addr.recipientPhone}</p>}
                    {addr.giftMessage && (
                      <p className="mt-2 text-gray-700"><span className="font-medium">Gift Message:</span> {addr.giftMessage}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sender</p>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium">{addr.senderName}</p>
                    {addr.senderEmail && <p>{addr.senderEmail}</p>}
                    {addr.senderPhone && <p>Phone: {addr.senderPhone}</p>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems?.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                <img
                  src={item.products?.image_url || "/placeholder.svg"}
                  alt={item.products?.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.products?.name}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity}
                    {item.size && ` | Size: ${item.size}`}
                    {item.color && ` | Color: ${item.color}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">৳{Number(item.subtotal || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">৳{Number(item.product_price || 0).toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tracking History */}
      <Card>
        <CardHeader>
          <CardTitle>Order Tracking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {tracking && tracking.length > 0 ? (
            <div className="space-y-6">
              {tracking.map((track, index) => (
                <div key={track.id} className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${index === 0 ? 'bg-blue-600' : 'bg-gray-400'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 capitalize">
                        {track.status?.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(track.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {track.message && <p className="text-sm text-gray-600">{track.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No tracking information available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
