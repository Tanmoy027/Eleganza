"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAppState } from "@/components/providers/app-state-provider"
import { withRetry, safeNavigate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { X, Loader2 } from "lucide-react"
import { syncVariantsUniformStock } from "@/lib/inventory"

export default function ProductForm({ product }) {
  const router = useRouter()
  const { setOperationState, isOperationActive, forceRefresh } = useAppState()
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    discount_price: product?.discount_price || "",
    discount_percentage: product?.discount_percentage || "",
    is_on_discount: product?.is_on_discount || false,
    category: product?.category || "",
    clothing_type: product?.clothing_type || "",
    occasion: product?.occasion || "",
    season: product?.season || "",
    sizes: product?.sizes?.join(", ") || "",
    colors: product?.colors?.join(", ") || "",
    stock_quantity: product?.stock_quantity || "",
    image_url: product?.image_url || "",
    images: product?.images || [],
  })

  const supabase = getSupabaseBrowserClient()

  // Clothing types based on category (matching exact database constraint values)
  const clothingTypes = {
    men: [
      { value: 'formal-shirt', label: 'Formal Shirt' },
      { value: 'casual-shirt', label: 'Casual Shirt' },
      { value: 'panjabi-kurta', label: 'Panjabi (Kurta)' },
      { value: 't-shirts', label: 'T-Shirts' },
      { value: 'polo-shirts', label: 'Polo Shirts' },
      { value: 'pants', label: 'Pants' },
      { value: 'trousers', label: 'Trousers' },
      { value: 'jeans', label: 'Jeans' },
      { value: 'denim', label: 'Denim' },
      { value: 'mens-loungewear', label: 'Loungewear' },
      { value: 'sleepwear', label: 'Sleepwear' },
      { value: 'jacket', label: 'Jacket' },
      { value: 'coat', label: 'Coat' },
      { value: 'sweater', label: 'Sweater' },
      { value: 'ethnic-outfits', label: 'Ethnic Outfits' },
      { value: 'formal-suits', label: 'Formal Suits' },
      { value: 'blazers', label: 'Blazers' }
    ],
    women: [
      { value: 'saree', label: 'Saree' },
      { value: 'salwar-kameez', label: 'Salwar-Kameez' },
      { value: 'kurti', label: 'Kurti' },
      { value: 'kurtas', label: 'Kurtas' },
      { value: 'tops', label: 'Tops' },
      { value: 'blouses', label: 'Blouses' },
      { value: 'maxi-dresses', label: 'Maxi Dresses' },
      { value: 'gowns', label: 'Gowns' },
      { value: 'skirts', label: 'Skirts' },
      { value: 'palazzos', label: 'Palazzos' },
      { value: 'nightwear', label: 'Nightwear' },
      { value: 'loungewear', label: 'Loungewear' },
      { value: 'hijab', label: 'Hijab' },
      { value: 'dupatta', label: 'Dupatta' },
      { value: 'scarves', label: 'Scarves' },
      { value: 'unstitched-cloth', label: 'Unstitched Cloth' },
      { value: 'western-wear-jackets', label: 'Western Wear Jackets' },
      { value: 'jumpsuits', label: 'Jumpsuits' }
    ],
    child: [
      { value: 'boys-shirts', label: 'Boys Shirts' },
      { value: 'girls-tops', label: 'Girls Tops' },
      { value: 'kids-t-shirts', label: 'Kids T-Shirts' },
      { value: 'boys-pants', label: 'Boys Pants' },
      { value: 'girls-dresses', label: 'Girls Dresses' },
      { value: 'kids-shorts', label: 'Kids Shorts' },
      { value: 'school-uniforms', label: 'School Uniforms' },
      { value: 'kids-ethnic-wear', label: 'Kids Ethnic Wear' },
      { value: 'baby-rompers', label: 'Baby Rompers' },
      { value: 'kids-sleepwear', label: 'Kids Sleepwear' },
      { value: 'kids-jackets', label: 'Kids Jackets' },
      { value: 'kids-traditional', label: 'Kids Traditional' },
      { value: 'kids-casual', label: 'Kids Casual' },
      { value: 'kids-formal', label: 'Kids Formal' }
    ]
  }

  // Handle category change - reset clothing type when category changes
  const handleCategoryChange = (value) => {
    setFormData({
      ...formData,
      category: value,
      clothing_type: "" // Reset clothing type when category changes
    })
  }

  // Handle discount calculations
  const handlePriceChange = (value) => {
    const price = parseFloat(value) || 0
    const discountPercentage = parseFloat(formData.discount_percentage) || 0

    let discountPrice = ""
    if (price > 0 && discountPercentage > 0) {
      discountPrice = (price - (price * discountPercentage / 100)).toFixed(2)
    }

    setFormData({
      ...formData,
      price: value,
      discount_price: discountPrice,
      is_on_discount: discountPercentage > 0
    })
  }

  const handleDiscountPercentageChange = (value) => {
    const percentage = parseFloat(value) || 0
    const price = parseFloat(formData.price) || 0

    let discountPrice = ""
    if (price > 0 && percentage > 0) {
      discountPrice = (price - (price * percentage / 100)).toFixed(2)
    }

    setFormData({
      ...formData,
      discount_percentage: value,
      discount_price: discountPrice,
      is_on_discount: percentage > 0
    })
  }

  const handleDiscountPriceChange = (value) => {
    const discountPrice = parseFloat(value) || 0
    const price = parseFloat(formData.price) || 0

    let percentage = ""
    if (price > 0 && discountPrice > 0 && discountPrice < price) {
      percentage = Math.round(((price - discountPrice) / price) * 100)
    }

    setFormData({
      ...formData,
      discount_price: value,
      discount_percentage: percentage.toString(),
      is_on_discount: discountPrice > 0 && discountPrice < price
    })
  }

  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Prevent multiple uploads
    if (uploadingImages || isOperationActive('imageUpload')) return

    setUploadingImages(true)
    setOperationState('imageUpload', true)
    const uploadedUrls = []
    let hasErrors = false
    let uploadedCount = 0

    try {
      // Process files one by one to avoid overwhelming the server
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
          // Add retry logic for upload with exponential backoff
          let uploadSuccess = false
          let retries = 0
          const maxRetries = 3

          while (!uploadSuccess && retries < maxRetries) {
            try {
              const { data, error } = await supabase.storage.from("productimage").upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              })

              if (error) {
                retries++
                if (retries >= maxRetries) {
                  console.error("Error uploading image after retries:", error)
                  alert(`Error uploading ${file.name}: ${error.message}`)
                  hasErrors = true
                } else {
                  // Exponential backoff
                  await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
                }
              } else {
                uploadSuccess = true
                const { data: { publicUrl } } = supabase.storage.from("productimage").getPublicUrl(filePath)

                if (publicUrl) {
                  uploadedUrls.push(publicUrl)
                  uploadedCount++

                  // Update state immediately for each successful upload
                  setFormData(prev => {
                    const newImages = [...prev.images, publicUrl]
                    const newImageUrl = prev.image_url && prev.image_url.trim() !== ''
                      ? prev.image_url
                      : newImages[0] || ""

                    return {
                      ...prev,
                      images: newImages,
                      image_url: newImageUrl,
                    }
                  })
                }
              }
            } catch (uploadError) {
              retries++
              if (retries >= maxRetries) {
                console.error("Upload error:", uploadError)
                alert(`Failed to upload ${file.name}: ${uploadError.message}`)
                hasErrors = true
              } else {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
              }
            }
          }
        } catch (err) {
          console.error("Upload error:", err)
          alert(`Failed to upload ${file.name}: ${err.message}`)
          hasErrors = true
        }

        // Small delay between file uploads to prevent rate limiting
        if (files.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      // Show success message
      if (uploadedCount > 0) {
        alert(`Successfully uploaded ${uploadedCount} image${uploadedCount > 1 ? 's' : ''}!`)
      }

      if (hasErrors && uploadedUrls.length === 0) {
        alert("No images were successfully uploaded. Please try again.")
      }
    } catch (error) {
      console.error("Unexpected error during upload:", error)
      alert("An unexpected error occurred. Please try again.")
    } finally {
      setUploadingImages(false)
      setOperationState('imageUpload', false)
      // Clear the input
      if (e.target) {
        e.target.value = ''
      }
    }
  }, [uploadingImages, isOperationActive, setOperationState, formData.images, supabase])

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

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    // Prevent multiple submissions
    if (loading || uploadingImages || isOperationActive('productSave')) {
      return
    }

    setLoading(true)
    setOperationState('productSave', true)

    try {
      // Validate required fields
      if (!formData.name || !formData.price || !formData.category || !formData.description) {
        alert("Please fill in all required fields")
        setLoading(false)
        return
      }

      if (formData.images.length === 0) {
        alert("Please upload at least one product image")
        setLoading(false)
        return
      }

      const productData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        discount_price: formData.discount_price ? Number.parseFloat(formData.discount_price) : null,
        discount_percentage: formData.discount_percentage ? Number.parseInt(formData.discount_percentage) : null,
        is_on_discount: formData.is_on_discount,
        stock_quantity: Number.parseInt(formData.stock_quantity) || 0,
        sizes: formData.sizes.split(",").map((s) => s.trim()).filter(s => s),
        colors: formData.colors.split(",").map((c) => c.trim()).filter(c => c),
      }

      let result
      let error

      // Add retry logic for database operations with exponential backoff
      let retries = 0
      const maxRetries = 3
      let success = false

      while (!success && retries < maxRetries) {
        try {
          if (product) {
            result = await supabase.from("products").update(productData).eq("id", product.id).select()
          } else {
            result = await supabase.from("products").insert([productData]).select()
          }
          error = result.error

          if (!error && result.data) {
            success = true
          } else {
            retries++
            if (retries < maxRetries) {
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
            }
          }
        } catch (err) {
          retries++
          error = err
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
          }
        }
      }

      if (error) {
        console.error("Error saving product:", error)
        alert("Error saving product: " + (error.message || "Unknown error"))
        setLoading(false)
        return
      }

      if (!success) {
        alert("Failed to save product after multiple attempts. Please try again.")
        setLoading(false)
        return
      }

      // Ensure variants exist and each combination carries the same stock
      try {
        const savedId = product ? product.id : (result?.data?.[0]?.id)
        if (savedId) {
          const perVariantStock = Number.parseInt(formData.stock_quantity) || 0
          await syncVariantsUniformStock(savedId, perVariantStock)
        }
      } catch (e) {
        console.warn('Variant sync warning:', e)
      }

      // Show success message
      alert(`Product ${product ? 'updated' : 'created'} successfully!`)

      // Navigate back with proper state management
      setTimeout(() => {
        // Use window.location for a complete refresh to ensure clean state
        window.location.href = "/admin/products"
      }, 1000)

    } catch (error) {
      console.error("Unexpected error:", error)
      alert("An unexpected error occurred: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
      setOperationState('productSave', false)
    }
  }, [loading, uploadingImages, isOperationActive, setOperationState, formData, product, supabase, router])

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
                onChange={(e) => handlePriceChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
              <p className="text-xs text-muted-foreground">This discount applies to all variants of this product.</p>
              <Input
                id="discount_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => handleDiscountPercentageChange(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_price">Discount Price ($)</Label>
              <Input
                id="discount_price"
                type="number"
                step="0.01"
                value={formData.discount_price}
                onChange={(e) => handleDiscountPriceChange(e.target.value)}
                placeholder="Auto-calculated"
              />
              {formData.is_on_discount && (
                <p className="text-sm text-green-600">
                  Save ৳{((parseFloat(formData.price) || 0) - (parseFloat(formData.discount_price) || 0)).toFixed(2)}
                  ({formData.discount_percentage}% off)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
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
              <Label htmlFor="clothing_type">Clothing Type</Label>
              <Select
                value={formData.clothing_type}
                onValueChange={(value) => setFormData({ ...formData, clothing_type: value })}
                disabled={!formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.category ? "Select clothing type" : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.category && clothingTypes[formData.category]?.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="puja">Puja</SelectItem>
                  <SelectItem value="eid">Eid</SelectItem>
                  <SelectItem value="christmas">Christmas</SelectItem>
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
              <Label htmlFor="stock">Per-Variant Stock</Label>
              <p className="text-xs text-muted-foreground">Each size/color variant will be created (if missing) and set to this stock on save. You can fine-tune per-variant in Inventory.</p>
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
              <p className="text-xs text-muted-foreground">These sizes create variants. Every size/color will get the same starting stock from the Stock field. You can adjust specific sizes/colors later in Inventory.</p>
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
              <p className="text-xs text-muted-foreground">Colors define variants along with sizes. Leave empty for no color variants.</p>
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
