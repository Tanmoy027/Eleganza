import { getSupabaseServerClient } from "@/lib/supabase/server"
import OrdersTable from "@/components/admin/orders-table"

export default async function AdminOrdersPage() {
  const supabase = await getSupabaseServerClient()

  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Orders</h1>
      <OrdersTable orders={orders || []} />
    </div>
  )
}
