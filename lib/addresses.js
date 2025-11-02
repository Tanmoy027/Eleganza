import { getSupabaseBrowserClient } from "./supabase/client"

// Shape mapping helpers
function toDbAddress(form) {
    return {
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zipCode,
    }
}

function fromDbAddress(row) {
    return {
        id: row.id,
        label: row.label,
        fullName: row.full_name || "",
        email: row.email || "",
        phone: row.phone || "",
        address: row.address || "",
        city: row.city || "",
        state: row.state || "",
        zipCode: row.zip_code || "",
        is_default: !!row.is_default,
        created_at: row.created_at,
    }
}

export async function getSavedAddresses() {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { addresses: [] }

    const { data, error } = await supabase
        .from("user_addresses")
        .select("id,label,full_name,email,phone,address,city,state,zip_code,is_default,created_at")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

    if (error) {
        console.warn("getSavedAddresses error", error)
        return { addresses: [] }
    }
    return { addresses: (data || []).map(fromDbAddress) }
}

export async function saveAddress(formAddress, setAsDefault = true, label = null) {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // If setting as default, clear previous default first to satisfy unique index
    if (setAsDefault) {
        await supabase
            .from("user_addresses")
            .update({ is_default: false })
            .eq("user_id", user.id)
            .eq("is_default", true)
    }

    const payload = {
        user_id: user.id,
        ...(label ? { label } : {}),
        ...toDbAddress(formAddress),
        is_default: !!setAsDefault,
    }

    const { data, error } = await supabase
        .from("user_addresses")
        .insert([payload])
        .select("id")
        .single()

    if (error) throw error
    return { id: data.id }
}

export async function setDefaultAddress(addressId) {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    // Clear any existing default
    await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true)

    // Set selected as default
    const { error } = await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("user_id", user.id)

    if (error) throw error
    return { ok: true }
}
