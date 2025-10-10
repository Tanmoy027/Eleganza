/**
 * Utility functions for handling product images consistently across the application
 */

/**
 * Get the main product image with proper fallback logic
 * @param {Object} product - Product object containing image_url and images array
 * @returns {string} - Valid image URL or placeholder
 */
export function getProductMainImage(product) {
    // First check if there's a main image_url and it's not empty
    if (product?.image_url && product.image_url.trim() !== '') {
        return product.image_url;
    }

    // Then check if there are images in the images array
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
        // Find the first non-empty image URL
        const validImage = product.images.find(img => img && img.trim() !== '');
        if (validImage) {
            return validImage;
        }
    }

    // Fallback to placeholder
    return "/placeholder.svg";
}

/**
 * Get all valid product images (filtering out empty ones)
 * @param {Object} product - Product object containing image_url and images array
 * @returns {Array} - Array of valid image URLs
 */
export function getProductImages(product) {
    const images = [];

    // Add main image_url if it exists and is not empty
    if (product?.image_url && product.image_url.trim() !== '') {
        images.push(product.image_url);
    }

    // Add images from images array if they exist and are not empty
    if (product?.images && Array.isArray(product.images)) {
        const validImages = product.images.filter(img => img && img.trim() !== '');

        // Add images that are not already in the array (avoid duplicates)
        validImages.forEach(img => {
            if (!images.includes(img)) {
                images.push(img);
            }
        });
    }

    // If no valid images found, return placeholder
    if (images.length === 0) {
        images.push("/placeholder.svg");
    }

    return images;
}

/**
 * Check if a product has valid images
 * @param {Object} product - Product object containing image_url and images array
 * @returns {boolean} - True if product has at least one valid image
 */
export function hasValidImages(product) {
    const mainImage = product?.image_url && product.image_url.trim() !== '';
    const hasImages = product?.images && Array.isArray(product.images) &&
        product.images.some(img => img && img.trim() !== '');

    return mainImage || hasImages;
}

/**
 * Validate image URL and return placeholder if invalid
 * @param {string} imageUrl - Image URL to validate
 * @returns {string} - Valid image URL or placeholder
 */
export function validateImageUrl(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        return "/placeholder.svg";
    }
    return imageUrl.trim();
}

/**
 * Handle image load error by setting placeholder
 * @param {Event} event - Image error event
 */
export function handleImageError(event) {
    if (event.target.src !== "/placeholder.svg") {
        event.target.src = "/placeholder.svg";
    }
}
