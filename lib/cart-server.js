import { getSupabaseServerClient } from "./supabase/server"

export async function getCart() {
    const supabase = await getSupabaseServerClient()

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

export async function clearCart() {
    const supabase = await getSupabaseServerClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("User not authenticated")
    }

    const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)

    return { error }
}
