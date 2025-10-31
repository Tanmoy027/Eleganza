"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function OrderStatusUpdate({ orderId, currentStatus }) {
    const [status, setStatus] = useState(currentStatus)
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    // Update local status when currentStatus prop changes
    useEffect(() => {
        setStatus(currentStatus)
    }, [currentStatus])

    // Check if the order is cancelled (handle both cases)
    const isOrderCancelled = currentStatus?.toLowerCase() === 'cancelled'
    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "completed", label: "Completed" },
        // Removed "cancelled" - only customers can cancel orders
    ]

    const handleStatusUpdate = async () => {
        if (!status) return

        // Additional frontend validation
        if (isOrderCancelled) {
            toast({
                title: "Cannot Update",
                description: "This order has been cancelled and cannot be modified.",
                variant: "destructive",
            })
            return
        }

        if (status?.toLowerCase() === 'cancelled') {
            toast({
                title: "Not Allowed",
                description: "Admins cannot set orders to Cancelled.",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/admin/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    status,
                    message: message || `Order status updated to ${status.replace('_', ' ')} by admin`
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update order status')
            }

            toast({
                title: "Status Updated",
                description: result.message || `Order status has been updated to ${status.replace('_', ' ')}.`,
            })

            setMessage("")
            router.refresh()
        } catch (error) {
            console.error("Error updating order status:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to update order status. Please try again.",
                variant: "destructive",
            })

            // If it's a cancelled order error, force refresh to show current state
            if (error.message?.includes('cancelled') || error.message?.includes('Cannot update')) {
                setTimeout(() => {
                    router.refresh()
                    window.location.reload()
                }, 1000)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddTrackingNote = async () => {
        if (!message.trim()) return

        setIsLoading(true)

        try {
            const response = await fetch('/api/admin/orders/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    status: currentStatus,
                    message: message.trim()
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add tracking note')
            }

            toast({
                title: "Note Added",
                description: result.message || "Tracking note has been added successfully.",
            })

            setMessage("")
            router.refresh()

        } catch (error) {
            console.error("Error adding tracking note:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to add tracking note. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Order Status</CardTitle>
                {isOrderCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-800 text-sm font-medium">
                            ⚠️ This order has been cancelled by the customer and cannot be modified.
                        </p>
                        <p className="text-red-600 text-xs mt-1">
                            Current Status: <span className="font-semibold uppercase">{currentStatus}</span>
                        </p>
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="status">Order Status</Label>
                    <Select
                        value={status}
                        onValueChange={setStatus}
                        disabled={isOrderCancelled}
                    >
                        <SelectTrigger className={isOrderCancelled ? "opacity-50 cursor-not-allowed" : ""}>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Tracking Message (Optional)</Label>
                    <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={isOrderCancelled ? "Cannot add messages to cancelled orders" : "Add a custom message for this status update..."}
                        rows={3}
                        disabled={isOrderCancelled}
                        className={isOrderCancelled ? "opacity-50 cursor-not-allowed" : ""}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleStatusUpdate}
                        disabled={isLoading || !status || isOrderCancelled || status === currentStatus}
                        className="flex-1"
                    >
                        {isLoading ? "Updating..." : isOrderCancelled ? "Cannot Update Cancelled Orders" : "Update Status"}
                    </Button>

                    {message.trim() && status === currentStatus && !isOrderCancelled && (
                        <Button
                            onClick={handleAddTrackingNote}
                            disabled={isLoading}
                            variant="outline"
                        >
                            Add Note Only
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
