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

  const isCancelled = (o) => {
    const s = o?.status?.toLowerCase()
    if (s === 'cancelled') return true
    // Also treat as cancelled if any tracking record says cancelled
    if (Array.isArray(o?.order_tracking)) {
      return o.order_tracking.some(t => t?.status?.toLowerCase() === 'cancelled')
    }
    return false
  }

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)

    // Find the current order to check if it's cancelled
    const currentOrder = orders.find(order => order.id === orderId)
    if (isCancelled(currentOrder)) {
      alert("Cannot update status of cancelled orders. Once an order is cancelled by the customer, it cannot be modified.")
      setUpdating(null)
      return
    }

    // Prevent selecting cancelled from admin dropdown
    if (newStatus?.toLowerCase() === 'cancelled') {
      alert("Admins cannot set orders to Cancelled. Customers can cancel their own orders.")
      setUpdating(null)
      return
    }

    try {
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          message: `Order status updated to ${newStatus.replace('_', ' ')} by admin`
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update order status')
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("Error updating order: " + error.message)
    } finally {
      setUpdating(null)
    }
  }

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId)
    const currentOrder = orders.find(order => order.id === orderId)
    if (isCancelled(currentOrder)) {
      alert("Cannot update payment of cancelled orders.")
      setUpdating(null)
      return
    }

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
              <TableCell className="font-medium">৳{order.total_amount.toFixed(2)}</TableCell>
              <TableCell>
                {/* Show red cancelled badge info if cancelled via tracking */}
                {isCancelled(order) && (
                  <div className="mb-1 text-xs text-red-600 font-semibold">CANCELLED</div>
                )}
                <Select
                  value={order.status}
                  onValueChange={(value) => handleStatusChange(order.id, value)}
                  disabled={updating === order.id || isCancelled(order)}
                >
                  <SelectTrigger className={`w-32 ${isCancelled(order) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                {isCancelled(order) && (
                  <p className="text-xs text-red-600 mt-1">Cannot modify cancelled orders</p>
                )}
              </TableCell>
              <TableCell>
                <Select
                  value={order.payment_status}
                  onValueChange={(value) => handlePaymentStatusChange(order.id, value)}
                  disabled={updating === order.id || isCancelled(order)}
                >
                  <SelectTrigger className={`w-32 ${isCancelled(order) ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
