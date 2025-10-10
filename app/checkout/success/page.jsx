import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { clearCart } from "@/lib/cart-server"

export default async function CheckoutSuccessPage({ searchParams }) {
  const params = await searchParams
  const sessionId = params.session_id

  if (!sessionId) {
    redirect("/cart")
  }

  const supabase = await getSupabaseServerClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Update order status
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ payment_status: "paid", status: "confirmed" })
    .eq("stripe_session_id", sessionId)
    .eq("user_id", user.id)
    .select("order_number")
    .single()

  if (updateError) {
    console.error("Error updating order:", updateError)
  }

  // Clear cart
  await clearCart()

  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Thank you for your order. We've received your payment and will process your order shortly.
            </p>
            {updatedOrder?.order_number && (
              <p className="text-sm font-medium">
                Order Number: {updatedOrder.order_number}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              You will receive an email confirmation with your order details.
            </p>
            <div className="flex flex-col gap-2 pt-4">
              <Button asChild>
                <Link href="/account/orders">View Orders</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Go to Home</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
