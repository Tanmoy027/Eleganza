// filepath: f:\\web development\\24 project\\apu\\new version\\shuvaapumain\\app\\api\\admin\\inventory\\apply-discounts\\route.js
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

    const { data, error } = await supabase.rpc('apply_stale_inventory_discounts', { default_percentage: 15, days_without_sale: 7 })
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ updated: data || 0 }), { status: 200 })
}
