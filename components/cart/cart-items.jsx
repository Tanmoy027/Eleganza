"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, Trash2 } from "lucide-react"
import { updateCartItemQuantity, removeFromCart } from "@/lib/cart"
import { getProductMainImage, handleImageError } from "@/lib/image-utils"

export function CartItems({ items }) {
  const router = useRouter()
  const [loading, setLoading] = useState({})

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    setLoading({ ...loading, [itemId]: true })
    const { error } = await updateCartItemQuantity(itemId, newQuantity)
    if (error) {
      alert("Error updating cart: " + error.message)
    }
    router.refresh()
    setLoading({ ...loading, [itemId]: false })
  }

  const handleRemove = async (itemId) => {
    setLoading({ ...loading, [itemId]: true })
    const { error } = await removeFromCart(itemId)
    if (error) {
      alert("Error removing item: " + error.message)
    }
    router.refresh()
    setLoading({ ...loading, [itemId]: false })
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={getProductMainImage(item.products)}
                  alt={item.products.name}
                  fill
                  className="object-cover rounded"
                  onError={handleImageError}
                />
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">{item.products.name}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Size: {item.size}</span>
                  <span>Color: {item.color}</span>
                </div>
                <p className="font-bold text-lg">৳{Number(item.products.price).toFixed(2)}</p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)} disabled={loading[item.id]}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={loading[item.id] || item.quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={loading[item.id] || item.quantity >= item.products.stock_quantity}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
