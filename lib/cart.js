import { getSupabaseBrowserClient } from "./supabase/client"

export async function addToCart(productId, quantity, size, color) {
  const supabase = getSupabaseBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Check if item already exists in cart
  const { data: existing } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("size", size || "")
    .eq("color", color || "")
    .single()

  if (existing) {
    // Update quantity
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)

    return { error }
  } else {
    // Insert new item
    const { error } = await supabase.from("cart_items").insert([
      {
        user_id: user.id,
        product_id: productId,
        quantity,
        size,
        color,
      },
    ])

    return { error }
  }
}

export async function getCartClient() {
  const supabase = getSupabaseBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      products (
        id,
        name,
        price,
        image_url,
        stock_quantity
      )
    `,
    )
    .eq("user_id", user.id)

  return data || []
}

export async function updateCartItemQuantity(cartItemId, quantity) {
  const supabase = getSupabaseBrowserClient()

  if (quantity <= 0) {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId)
    return { error }
  }

  const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId)

  return { error }
}

export async function removeFromCart(cartItemId) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId)

  return { error }
}

export async function clearCart() {
  const supabase = getSupabaseBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)

  return { error }
}
