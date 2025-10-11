import { getSupabaseBrowserClient } from "./supabase/client"

// Get user orders with detailed information
export async function getUserOrders() {
    const supabase = getSupabaseBrowserClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                id,
                product_name,
                product_price,
                quantity,
                size,
                color,
                subtotal,
                product_id
            ),
            order_tracking (
                id,
                status,
                message,
                created_at
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return { data, error }
}

// Get a specific order by ID
export async function getOrderById(orderId) {
    const supabase = getSupabaseBrowserClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                id,
                product_name,
                product_price,
                quantity,
                size,
                color,
                subtotal,
                product_id
            ),
            order_tracking (
                id,
                status,
                message,
                created_at
            )
        `)
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single()

    return { data, error }
}

// Cancel an order (only if status is 'pending')
export async function cancelOrder(orderId) {
    const supabase = getSupabaseBrowserClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("User not authenticated")
    }

    // First check if order can be cancelled
    const { data: order } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single()

    if (!order) {
        throw new Error("Order not found")
    }

    if (order.status !== 'pending') {
        throw new Error("Order cannot be cancelled at this stage")
    }

    // Update order status
    const { data, error } = await supabase
        .from("orders")
        .update({
            status: "cancelled",
            payment_status: "refunded"
        })
        .eq("id", orderId)
        .eq("user_id", user.id)
        .select()

    return { data, error }
}

// Add order tracking entry (for admin use or system updates)
export async function addOrderTracking(orderId, status, message) {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
        .from("order_tracking")
        .insert({
            order_id: orderId,
            status,
            message: message || `Order status updated to ${status}`
        })
        .select()

    return { data, error }
}

// Get order statistics for user
export async function getOrderStats() {
    const supabase = getSupabaseBrowserClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("User not authenticated")
    }

    const { data: orders, error } = await supabase
        .from("orders")
        .select("status, total_amount, created_at")
        .eq("user_id", user.id)

    if (error) {
        return { data: null, error }
    }

    const stats = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0),
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        completedOrders: orders.filter(order => order.status === 'completed' || order.status === 'delivered').length,
        recentOrders: orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
    }

    return { data: stats, error: null }
}

// Utility functions for order status
export const orderStatusUtils = {
    getStatusColor: (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'confirmed':
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'shipped':
            case 'out_for_delivery':
                return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'delivered':
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'cancelled':
            case 'refunded':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    },

    getStatusIcon: (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'Clock'
            case 'confirmed':
            case 'processing':
                return 'Package'
            case 'shipped':
            case 'out_for_delivery':
                return 'Truck'
            case 'delivered':
            case 'completed':
                return 'CheckCircle'
            case 'cancelled':
            case 'refunded':
                return 'XCircle'
            default:
                return 'Package'
        }
    },

    canCancelOrder: (status) => {
        return status?.toLowerCase() === 'pending'
    },

    isOrderComplete: (status) => {
        return ['delivered', 'completed'].includes(status?.toLowerCase())
    },

    getNextStatus: (currentStatus) => {
        const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
        const currentIndex = statusFlow.indexOf(currentStatus?.toLowerCase())
        return currentIndex >= 0 && currentIndex < statusFlow.length - 1
            ? statusFlow[currentIndex + 1]
            : null
    }
}
