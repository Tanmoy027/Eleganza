import { getSupabaseBrowserClient } from "./supabase/client"

export async function addToCart(productId, quantity, size, color) {
  const supabase = getSupabaseBrowserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const normalizedSize = (size || "").toUpperCase() || null
  const normalizedColor = (color || "").toLowerCase() || null

  // If variant specified, ensure availability
  let variant = null
  if (normalizedSize !== null || normalizedColor !== null) {
    let query = supabase
      .from("product_variants")
      .select("id, stock_quantity")
      .eq("product_id", productId)
      .limit(1)
    if (normalizedSize === null) query = query.is('size', null); else query = query.eq('size', normalizedSize)
    if (normalizedColor === null) query = query.is('color', null); else query = query.eq('color', normalizedColor)
    const { data: v } = await query.maybeSingle()
    variant = v || null
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

  const nextQty = (existing?.quantity || 0) + quantity

  if (variant && typeof variant.stock_quantity === 'number' && nextQty > variant.stock_quantity) {
    return { error: { message: `Only ${variant.stock_quantity} in stock for the selected variant` } }
  }

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("id", existing.id)

    return { error }
  } else {
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
