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

export default function CancelOrderButton({ orderId, orderNumber, className = "", size = "sm" }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleCancelOrder = async () => {
        setIsLoading(true)

        try {
            const { data, error } = await cancelOrder(orderId)

            if (error) {
                throw error
            } toast({
                title: "✅ Order Cancelled Successfully",
                description: `Order #${orderNumber || orderId.slice(0, 8)} has been cancelled and will be removed from your orders.`,
                duration: 3000,
            })

            // Immediately refresh to show updated status
            router.refresh()

            // Navigate based on current location with a delay to show the toast
            setTimeout(() => {
                const currentPath = window.location.pathname
                if (currentPath.includes('/orders/') && !currentPath.endsWith('/orders')) {
                    // If on individual order page, go to orders list
                    router.push('/orders')
                } else {
                    // Force reload to ensure cancelled orders are updated in the list
                    window.location.reload()
                }
            }, 1500)
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

    return (<AlertDialog>
        <AlertDialogTrigger asChild>
            <Button
                variant="outline"
                size={size}
                className={`text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 ${className}`}
            >
                Cancel Order
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to cancel order #{orderNumber || orderId.slice(0, 8)}?
                    This action cannot be undone. Orders can only be cancelled before they are confirmed.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Keep Order</AlertDialogCancel>
                <AlertDialogAction
                    onClick={handleCancelOrder}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                >
                    {isLoading ? "Cancelling Order..." : "Cancel Order"}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    )
}
