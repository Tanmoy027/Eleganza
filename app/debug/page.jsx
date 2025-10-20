"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function DebugPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProducts() {
            const supabase = getSupabaseBrowserClient()

            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("is_active", true)

            console.log("All products:", data)
            console.log("Error:", error)

            if (data) {
                setProducts(data)
            }
            setLoading(false)
        }

        fetchProducts()
    }, [])

    if (loading) {
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Products</h1>
            <p className="mb-4">Total products: {products.length}</p>

            <div className="space-y-4">
                {products.map(product => (
                    <div key={product.id} className="border p-4 rounded">
                        <h3 className="font-bold">{product.name}</h3>                        <p>Price: ৳{product.price}</p>
                        <p>Discount Price: ৳{product.discount_price || 'None'}</p>
                        <p>Discount Percentage: {product.discount_percentage || 'None'}%</p>
                        <p>Is On Discount: {product.is_on_discount ? 'Yes' : 'No'}</p>
                        <p>Category: {product.category}</p>
                        <p>Active: {product.is_active ? 'Yes' : 'No'}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
