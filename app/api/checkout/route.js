import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getBaseUrl } from "@/lib/url-utils"
import { logEnvironmentStatus } from "@/lib/environment-checker"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const { orderId, cartItems, total, shippingAddress } = await request.json()

    console.log("Checkout request data:", { orderId, cartItems: cartItems.length, total })

    // Log environment status for debugging
    logEnvironmentStatus()

    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the base URL for redirects - works for both development and production
    const baseUrl = getBaseUrl(request)

    console.log("Base URL for Stripe redirects:", baseUrl)
    console.log("Environment:", process.env.NODE_ENV)
    console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cartItems.map((item) => {
        const productData = {
          name: item.products.name,
          description: `Size: ${item.size}, Color: ${item.color}`,
        }

        // Don't include images to avoid URL validation errors
        return {
          price_data: {
            currency: "usd",
            product_data: productData,
            unit_amount: Math.round(Number(item.products.price) * 100),
          },
          quantity: item.quantity,
        }
      }),
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: {
        orderId: orderId.toString(),
        userId: user.id,
      },
    })

    console.log("Stripe session created with URLs:", {
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`
    })

    // Update order with Stripe session ID
    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", orderId)

    return NextResponse.json({ sessionId: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
