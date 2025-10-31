import { getSupabaseServerClient } from "@/lib/supabase/server"
import OrdersTable from "@/components/admin/orders-table"

// Add revalidation to ensure fresh data
export const revalidate = 0

export default async function AdminOrdersPage() {
  const supabase = await getSupabaseServerClient()

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(full_name, email), order_tracking(status, created_at)")
    .order("created_at", { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Orders</h1>
      <OrdersTable orders={orders || []} />
    </div>
  )
}
