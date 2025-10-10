"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { X, Loader2 } from "lucide-react"
import { validateImageUrl } from "@/lib/image-utils"

export default function ProductForm({ product }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    category: product?.category || "",
    occasion: product?.occasion || "",
    season: product?.season || "",
    sizes: product?.sizes?.join(", ") || "",
    colors: product?.colors?.join(", ") || "",
    stock_quantity: product?.stock_quantity || "",
    image_url: product?.image_url || "",
    images: product?.images || [],
  })

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    const uploadedUrls = []
    let hasErrors = false

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file`)
        continue
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`)
        continue
      }

      const fileExt = file.name.split(".").pop().toLowerCase()
      const fileName = `product-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      try {
        const { data, error } = await supabase.storage.from("productimage").upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

        if (error) {
          console.error("Error uploading image:", error)
          alert(`Error uploading ${file.name}: ${error.message}`)
          hasErrors = true
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("productimage").getPublicUrl(filePath)

          if (publicUrl) {
            uploadedUrls.push(publicUrl)
          }
        }
      } catch (err) {
        console.error("Upload error:", err)
        alert(`Failed to upload ${file.name}`)
        hasErrors = true
      }
    }

    if (uploadedUrls.length > 0) {
      const newImages = [...formData.images, ...uploadedUrls]
      // Set the main image_url to the first image if not already set
      const newImageUrl = formData.image_url && formData.image_url.trim() !== ''
        ? formData.image_url
        : newImages[0] || "";

      setFormData({
        ...formData,
        images: newImages,
        image_url: newImageUrl,
      })
    }

    if (hasErrors && uploadedUrls.length === 0) {
      alert("No images were successfully uploaded. Please try again.")
    }

    setUploadingImages(false)
    // Clear the input
    e.target.value = ''
  }

  const removeImage = (indexToRemove) => {
    const newImages = formData.images.filter((_, index) => index !== indexToRemove)

    // Update the main image_url if we're removing the first image
    let newImageUrl = formData.image_url
    if (indexToRemove === 0 && newImages.length > 0) {
      newImageUrl = newImages[0]
    } else if (newImages.length === 0) {
      newImageUrl = ""
    }

    setFormData({
      ...formData,
      images: newImages,
      image_url: newImageUrl,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const productData = {
      ...formData,
      price: Number.parseFloat(formData.price),
      stock_quantity: Number.parseInt(formData.stock_quantity),
      sizes: formData.sizes.split(",").map((s) => s.trim()),
      colors: formData.colors.split(",").map((c) => c.trim()),
    }

    let error
    if (product) {
      const result = await supabase.from("products").update(productData).eq("id", product.id)
      error = result.error
    } else {
      const result = await supabase.from("products").insert([productData])
      error = result.error
    }

    if (error) {
      alert("Error saving product: " + error.message)
    } else {
      router.push("/admin/products")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Select
                value={formData.occasion}
                onValueChange={(value) => setFormData({ ...formData, occasion: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="party">Party</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring">Spring</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="autumn">Autumn</SelectItem>
                  <SelectItem value="winter">Winter</SelectItem>
                  <SelectItem value="all-season">All Season</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sizes">Sizes (comma separated)</Label>
              <Input
                id="sizes"
                placeholder="S, M, L, XL"
                value={formData.sizes}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="colors">Colors (comma separated)</Label>
              <Input
                id="colors"
                placeholder="Red, Blue, Black"
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="images">Product Images</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="flex-1"
                />
                {uploadingImages && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Upload multiple images for this product</p>
            </div>

            {/* Image preview grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url && url.trim() !== '' ? url : "/placeholder.svg"}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading || uploadingImages}>
              {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
