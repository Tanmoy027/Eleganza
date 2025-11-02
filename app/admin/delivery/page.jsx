import { getSupabaseServerClient } from "@/lib/supabase/server"
import DeliveryVerifyOTP from "@/components/admin/delivery-verify-otp"

export const revalidate = 0

export default async function AdminDeliveryPage() {
    const supabase = await getSupabaseServerClient()
    const { data: recentDelivered } = await supabase
        .from("orders")
        .select("id, order_number, status, created_at")
        .eq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(5)

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Delivery</h1>
            <p className="text-gray-600">Verify customer OTPs and confirm deliveries.</p>
            <DeliveryVerifyOTP />
            {Array.isArray(recentDelivered) && recentDelivered.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Recently Marked as Delivered</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                        {recentDelivered.map(o => (
                            <li key={o.id} className="flex items-center justify-between">
                                <span>#{o.order_number || o.id.slice(0, 8)}</span>
                                <span className="text-gray-500">{new Date(o.created_at).toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
