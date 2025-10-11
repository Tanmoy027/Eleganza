"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cancelOrder } from "@/lib/orders"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

export default function CancelOrderButton({ orderId, orderNumber }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleCancelOrder = async () => {
        setIsLoading(true)

        try {
            const { error } = await cancelOrder(orderId)

            if (error) {
                throw error
            }

            toast({
                title: "Order Cancelled",
                description: `Order #${orderNumber || orderId.slice(0, 8)} has been successfully cancelled.`,
            })

            router.refresh()
        } catch (error) {
            console.error("Error cancelling order:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to cancel order. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    Cancel Order
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to cancel order #{orderNumber || orderId.slice(0, 8)}?
                        This action cannot be undone, but you will receive a full refund.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleCancelOrder}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? "Cancelling..." : "Cancel Order"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
