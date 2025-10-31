import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getBaseUrl } from "@/lib/url-utils"
import { logEnvironmentStatus } from "@/lib/environment-checker"
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const { orderId, cartItems, total, shippingAddress, isGift } = await request.json()

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
            currency: "bdt",
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
        isGift: isGift ? "true" : "false",
      },
    })

    console.log("Stripe session created with URLs:", {
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`
    })

    // Update order with Stripe session ID
    console.log("Attempting to update order with ID:", orderId)

    // First, check if the order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from("orders")
      .select("id, order_number, user_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()

    if (checkError || !existingOrder) {
      console.error("Order not found:", { orderId, checkError, existingOrder })
      return NextResponse.json({
        error: "Order not found or access denied",
        details: checkError ? checkError.message : "Order does not exist"
      }, { status: 404 })
    }

    console.log("Order found, updating with session ID:", existingOrder)

    // Use service role client to bypass RLS for updating system-managed fields
    const serviceClient = getSupabaseServiceRoleClient()

    // Perform atomic update + return updated row
    const { data: updated, error: updateError } = await serviceClient
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderId)
      .select("id, order_number, stripe_session_id")
      .single()

    if (updateError) {
      console.error("Error updating order with session ID:", updateError)
      return NextResponse.json({
        error: "Failed to update order with session ID",
        details: updateError.message
      }, { status: 500 })
    }

    // Fallback: if no row was returned (no match), try a relaxed update filtered only by id
    if (!updated) {
      console.warn("No row returned from update. Retrying relaxed update...")
      const { data: updatedAlt, error: altError } = await serviceClient
        .from("orders")
        .update({ stripe_session_id: session.id })
        .eq("id", orderId)
        .select("id, order_number, stripe_session_id")
        .single()

      if (altError) {
        console.error("Relaxed update failed:", altError)
        // Do not block checkout; proceed and rely on webhook to reconcile
        console.warn("Proceeding without local session_id set; webhook will backfill")
        console.log("Returning Stripe session URL:", session.url)
        return NextResponse.json({ sessionId: session.url })
      }

      if (!updatedAlt) {
        console.warn("Relaxed update returned no row; proceeding and relying on webhook")
        console.log("Returning Stripe session URL:", session.url)
        return NextResponse.json({ sessionId: session.url })
      }

      if (!updatedAlt.stripe_session_id) {
        console.warn("Relaxed update did not set session ID", { orderId, sessionId: session.id })
        console.log("Returning Stripe session URL:", session.url)
        return NextResponse.json({ sessionId: session.url })
      }

      console.log("Order updated with session ID (relaxed):", { orderId, sessionId: session.id })
      console.log("Returning Stripe session URL:", session.url)
      return NextResponse.json({ sessionId: session.url })
    }

    // Verify the session ID was set
    console.log("Update response:", { updatedOrder: updated })

    if (!updated.stripe_session_id) {
      console.warn("stripe_session_id not persisted on order immediately; proceeding anyway", { orderId })
      console.log("Returning Stripe session URL:", session.url)
      return NextResponse.json({ sessionId: session.url })
    }

    console.log("Order updated with session ID:", { orderId, sessionId: session.id })
    console.log("Returning Stripe session URL:", session.url)

    return NextResponse.json({ sessionId: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
