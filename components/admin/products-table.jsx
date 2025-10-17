"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { getProductMainImage, handleImageError } from "@/lib/image-utils"

export default function ProductsTable({ products }) {
  const router = useRouter()
  const [loading, setLoading] = useState(null)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    setLoading(id)
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      alert("Error deleting product: " + error.message)
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Occasion</TableHead>
            <TableHead>Season</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const mainImage = getProductMainImage(product)
            console.log("[v0] Admin table - Product:", product.name, "Main image:", mainImage)

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="relative w-12 h-12">
                    <Image
                      src={mainImage || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover rounded"
                      onError={handleImageError}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-sm">{product.clothing_type ? product.clothing_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}</TableCell>
                <TableCell>{product.occasion}</TableCell>
                <TableCell>{product.season}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>{product.stock_quantity}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/admin/products/${product.id}`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(product.id)}
                      disabled={loading === product.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
