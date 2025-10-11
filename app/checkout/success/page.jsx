import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { clearCart } from "@/lib/cart-server"
import Stripe from "stripe"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"

export default async function CheckoutSuccessPage({ searchParams }) {
  const params = await searchParams
  const sessionId = params.session_id

  if (!sessionId) {
    redirect("/cart")
  }

  console.log("Success page - Session ID:", sessionId)

  const supabase = await getSupabaseServerClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  console.log("Success page - User ID:", user.id)

  // First try to get the order details using maybeSingle to avoid errors if not found
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, payment_status, status, stripe_payment_intent_id")
    .eq("stripe_session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle()

  console.log("Success page - Order lookup result:", { order, orderError })

  let updatedOrder = order

  // If order not found, there might be a webhook processing delay
  if (!order && !orderError) {
    console.log("Order not found, might be webhook delay. Waiting and retrying...")

    // Wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: retryOrder } = await supabase
      .from("orders")
      .select("id, order_number, payment_status, status, stripe_payment_intent_id")
      .eq("stripe_session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle()

    updatedOrder = retryOrder
  }

  // If we found the order but it's not paid yet, try to update it
  // OR if no order found at all, try to update payment status
  if ((updatedOrder && updatedOrder.payment_status !== "paid") || !updatedOrder) {
    console.log("Attempting to update payment status...")
    console.log("Current order status:", updatedOrder?.payment_status, updatedOrder?.status)

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.retrieve(sessionId)

      console.log("Stripe session verification:", {
        id: session.id,
        payment_status: session.payment_status,
        payment_intent: session.payment_intent
      })

      if (session.payment_status === "paid") {
        const serviceClient = getSupabaseServiceRoleClient()

        // Try update by session ID only
        const { data: upBySession, error: updErr1 } = await serviceClient
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            stripe_payment_intent_id: session.payment_intent,
          })
          .eq("stripe_session_id", sessionId)
          .select("id, order_number, payment_status, status")

        console.log("Payment update by sessionId result:", { upBySession, updErr1 })

        let finalUpdated = Array.isArray(upBySession) && upBySession.length > 0 ? upBySession[0] : null

        // Fallback: update by order ID if we have it and session match returned nothing
        if (!finalUpdated && updatedOrder?.id) {
          const { data: upById, error: updErr2 } = await serviceClient
            .from("orders")
            .update({
              payment_status: "paid",
              status: "confirmed",
              stripe_payment_intent_id: session.payment_intent,
            })
            .eq("id", updatedOrder.id)
            .select("id, order_number, payment_status, status")

          console.log("Payment update by orderId result:", { upById, updErr2 })
          if (!updErr2 && Array.isArray(upById) && upById.length > 0) {
            finalUpdated = upById[0]
          }
        }

        if (finalUpdated) {
          updatedOrder = finalUpdated
          console.log("Order updated successfully:", updatedOrder)
        } else {
          console.warn("No order updated after verification; relying on webhook or later sync")
        }
      } else {
        console.log("Payment not completed. Status:", session.payment_status)
      }
    } catch (error) {
      console.error("Error in payment update process:", error)
    }
  }

  // Clear cart only if we have a valid order
  if (updatedOrder) {
    await clearCart()
  }

  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              {updatedOrder ? "Payment Successful!" : "Payment Processing"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              {updatedOrder
                ? "Thank you for your order. We've received your payment and will process your order shortly."
                : "Your payment is being processed. If this page doesn't update, please check your orders page."
              }
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
