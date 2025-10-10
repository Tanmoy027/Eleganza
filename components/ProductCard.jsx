import Image from "next/image"
import { useState } from "react"
import { Star } from "lucide-react"
import Link from "next/link"
import { getProductMainImage, handleImageError as handleImgError } from "@/lib/image-utils"

export default function ProductCard({ product }) {
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
    <div className="group cursor-pointer">
      <Link href={`/products/${product.id}`}>
        <div className="relative mb-4 overflow-hidden cursor-pointer">
          <Image
            src={imageSrc}
            alt={product.name}
            width={300}
            height={400}
            className="w-full h-80 md:h-96 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
          {product.isNew && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-xs font-medium">NEW</div>
          )}
          {product.isOffer && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs font-medium">SALE</div>
          )}
        </div>
      </Link>

      <div className="space-y-2">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-gray-600 cursor-pointer transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center space-x-1">
          {[...Array(product.rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current text-black" />
          ))}
          <span className="text-xs text-gray-500 ml-2">({product.reviews || product.rating})</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">${Number(product.price).toFixed(2)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-gray-400 line-through">${Number(product.compare_at_price).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
