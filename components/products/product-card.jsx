"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProductMainImage, handleImageError as handleImgError } from "@/lib/image-utils"

export function ProductCard({ product }) {
  const [imageSrc, setImageSrc] = useState(getProductMainImage(product));
  const [imageError, setImageError] = useState(false);

  // Handle image load error
  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      setImageSrc("/placeholder.svg");
      handleImgError(e);
    }
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            onError={handleImageError}
          />
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold line-clamp-1">{product.name}</h3>
          <div className="mt-2 flex gap-2">
            <Badge variant="secondary" className="text-xs capitalize">
              {product.category}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {product.occasion}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="text-lg font-bold">${Number(product.price).toFixed(2)}</p>
        </CardFooter>
      </Card>
    </Link>
  )
}
