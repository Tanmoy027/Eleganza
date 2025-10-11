"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
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

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
    ]

    const handleStatusUpdate = async () => {
        if (!status) return

        setIsLoading(true)

        try {
            // Update order status
            const { error: orderError } = await supabase
                .from("orders")
                .update({ status })
                .eq("id", orderId)

            if (orderError) throw orderError

            // Add tracking entry
            const { error: trackingError } = await supabase
                .from("order_tracking")
                .insert({
                    order_id: orderId,
                    status,
                    message: message || `Order status updated to ${status.replace('_', ' ')} by admin`
                })

            if (trackingError) throw trackingError

            toast({
                title: "Status Updated",
                description: `Order status has been updated to ${status.replace('_', ' ')}.`,
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
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddTrackingNote = async () => {
        if (!message.trim()) return

        setIsLoading(true)

        try {
            const { error } = await supabase
                .from("order_tracking")
                .insert({
                    order_id: orderId,
                    status: currentStatus,
                    message: message.trim()
                })

            if (error) throw error

            toast({
                title: "Note Added",
                description: "Tracking note has been added successfully.",
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
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="status">Order Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
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
                        placeholder="Add a custom message for this status update..."
                        rows={3}
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleStatusUpdate}
                        disabled={isLoading || !status}
                        className="flex-1"
                    >
                        {isLoading ? "Updating..." : "Update Status"}
                    </Button>

                    {message.trim() && status === currentStatus && (
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
