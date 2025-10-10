/**
 * Utility functions for handling product images consistently across the application
 */

/**
 * Check if a URL is a placeholder
 * @param {string} url - URL to check
 * @returns {boolean} - True if URL is a placeholder
 */
function isPlaceholder(url) {
    if (!url || typeof url !== "string") return true
    const trimmedUrl = url.trim()
    return trimmedUrl === "" || trimmedUrl === "/placeholder.svg" || trimmedUrl.startsWith("/placeholder.svg?")
}

/**
 * Get the main product image with proper fallback logic
 * @param {Object} product - Product object containing image_url and images array
 * @returns {string} - Valid image URL or placeholder
 */
export function getProductMainImage(product) {
    console.log("[v0] getProductMainImage called for product:", product?.name)
    console.log("[v0] image_url:", product?.image_url)
    console.log("[v0] images array:", product?.images)

    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
        // Find the first non-empty, non-placeholder image URL
        const validImage = product.images.find((img) => img && !isPlaceholder(img))
        if (validImage) {
            console.log("[v0] Found valid image in images array:", validImage)
            return validImage
        }
    }

    if (product?.image_url && !isPlaceholder(product.image_url)) {
        console.log("[v0] Using image_url:", product.image_url)
        return product.image_url
    }

    // Fallback to placeholder
    console.log("[v0] No valid images found, using placeholder")
    return "/placeholder.svg"
}

/**
 * Get all valid product images (filtering out empty ones and placeholders)
 * @param {Object} product - Product object containing image_url and images array
 * @returns {Array} - Array of valid image URLs
 */
export function getProductImages(product) {
    const images = []

    if (product?.images && Array.isArray(product.images)) {
        const validImages = product.images.filter((img) => img && !isPlaceholder(img))
        images.push(...validImages)
    }

    if (product?.image_url && !isPlaceholder(product.image_url) && !images.includes(product.image_url)) {
        images.push(product.image_url)
    }

    // If no valid images found, return placeholder
    if (images.length === 0) {
        images.push("/placeholder.svg")
    }

    return images
}

/**
 * Check if a product has valid images
 * @param {Object} product - Product object containing image_url and images array
 * @returns {boolean} - True if product has at least one valid image
 */
export function hasValidImages(product) {
    const mainImage = product?.image_url && !isPlaceholder(product.image_url)
    const hasImages =
        product?.images && Array.isArray(product.images) && product.images.some((img) => img && !isPlaceholder(img))

    return mainImage || hasImages
}

/**
 * Validate image URL and return placeholder if invalid
 * @param {string} imageUrl - Image URL to validate
 * @returns {string} - Valid image URL or placeholder
 */
export function validateImageUrl(imageUrl) {
    if (isPlaceholder(imageUrl)) {
        return "/placeholder.svg"
    }
    return imageUrl.trim()
}

/**
 * Handle image load error by setting placeholder
 * @param {Event} event - Image error event
 */
export function handleImageError(event) {
    if (event.target.src !== "/placeholder.svg") {
        event.target.src = "/placeholder.svg"
    }
}
