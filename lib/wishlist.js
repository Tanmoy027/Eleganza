import { getSupabaseBrowserClient } from "./supabase/client"

export async function addToWishlist(productId) {
    const supabase = getSupabaseBrowserClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("You must be logged in to add items to wishlist")
    }

    const { data, error } = await supabase
        .from("wishlist")
        .insert({
            user_id: user.id,
            product_id: productId,
        })
        .select()
        .single()

    return { data, error }
}

export async function removeFromWishlist(productId) {
    const supabase = getSupabaseBrowserClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("You must be logged in to remove items from wishlist")
    }

    const { error } = await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId)

    return { error }
}

export async function isInWishlist(productId) {
    const supabase = getSupabaseBrowserClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return false
    }

    const { data, error } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single()

    return !error && data !== null
}

export async function getWishlistCount() {
    const supabase = getSupabaseBrowserClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return 0
    }

    const { count, error } = await supabase
        .from("wishlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

    return error ? 0 : count
}
