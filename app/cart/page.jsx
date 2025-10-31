import { getCart } from "@/lib/cart-server"
import { CartItems } from "@/components/cart/cart-items"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"

export default async function CartPage() {
  const cartItems = await getCart()

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.products.price) * item.quantity, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  if (cartItems.length === 0) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center space-y-6">
          <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground" />
          <h1 className="text-3xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground">Add some products to get started!</p>
          <Button asChild size="lg">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CartItems items={cartItems} />
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-semibold">৳{tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>৳{total.toFixed(2)}</span>
                </div>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
