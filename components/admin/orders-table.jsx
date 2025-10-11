"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function OrdersTable({ orders }) {
  const router = useRouter()
  const [updating, setUpdating] = useState(null)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)

    // Update order status
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId)

    if (orderError) {
      alert("Error updating order: " + orderError.message)
      setUpdating(null)
      return
    }

    // Add tracking entry
    const { error: trackingError } = await supabase
      .from("order_tracking")
      .insert({
        order_id: orderId,
        status: newStatus,
        message: `Order status updated to ${newStatus.replace('_', ' ')} by admin`
      })

    if (trackingError) {
      console.error("Error adding tracking entry:", trackingError)
    }

    router.refresh()
    setUpdating(null)
  }

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)
    const { error } = await supabase.from("orders").update({ payment_status: newStatus }).eq("id", orderId)

    if (error) {
      alert("Error updating payment status: " + error.message)
    } else {
      router.refresh()
    }
    setUpdating(null)
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{order.profiles?.full_name || "Guest"}</p>
                  <p className="text-sm text-gray-600">{order.profiles?.email}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">${order.total_amount.toFixed(2)}</TableCell>
              <TableCell>
                <Select
                  value={order.status}
                  onValueChange={(value) => handleStatusChange(order.id, value)}
                  disabled={updating === order.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={order.payment_status}
                  onValueChange={(value) => handlePaymentStatusChange(order.id, value)}
                  disabled={updating === order.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
