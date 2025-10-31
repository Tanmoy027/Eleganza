import { redirect } from "next/navigation"
import { getCart } from "@/lib/cart-server"
import { GiftCheckoutForm } from "@/components/checkout/gift-checkout-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function GiftCheckoutPage() {
    const cartItems = await getCart()

    if (cartItems.length === 0) {
        redirect("/cart")
    }

    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.products.price) * item.quantity, 0)
    const tax = subtotal * 0.1
    const total = subtotal + tax

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-8">Send as Gift</h1>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <GiftCheckoutForm cartItems={cartItems} total={total} />
                </div>

                <div>
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {item.products.name} x {item.quantity}
                                    </span>
                                    <span className="font-semibold">৳{(Number(item.products.price) * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax (10%)</span>
                                    <span className="font-semibold">৳{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>৳{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
