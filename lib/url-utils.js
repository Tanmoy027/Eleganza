// URL utilities for handling development vs production URLs

/**
 * Get the base URL for the application
 * This works for both development (localhost) and production
 */
export function getBaseUrl(request = null) {
    // Priority 1: Environment variable (set this in production)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
        return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '') // Remove trailing slash
    }

    // Priority 2: Use Vercel URL if deployed on Vercel
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`
    }

    // Priority 3: Use Netlify URL if deployed on Netlify
    if (process.env.NETLIFY && process.env.URL) {
        return process.env.URL
    }

    // Priority 4: Extract from request headers (for API routes)
    if (request) {
        const headers = request.headers
        const host = headers.get('host')

        // Determine protocol
        let protocol = 'https' // Default to https for production

        // Check various headers for protocol
        if (headers.get('x-forwarded-proto')) {
            protocol = headers.get('x-forwarded-proto')
        } else if (headers.get('x-forwarded-ssl') === 'on') {
            protocol = 'https'
        } else if (host?.includes('localhost') || host?.includes('127.0.0.1') || host?.includes('192.168.')) {
            protocol = 'http' // Local development
        }

        if (host) {
            return `${protocol}://${host}`
        }
    }

    // Priority 5: Client-side window location
    if (typeof window !== 'undefined') {
        return window.location.origin
    }

    // Priority 6: Default fallback for development
    return 'http://localhost:3000'
}

/**
 * Get redirect URL for authentication flows
 * This ensures users are redirected to the correct domain after auth actions
 */
export function getAuthRedirectUrl(path = '/') {
    const baseUrl = getBaseUrl()
    return `${baseUrl}${path}`
}

/**
 * Get the current environment
 */
export function getEnvironment() {
    if (process.env.VERCEL_ENV) {
        return process.env.VERCEL_ENV // 'production', 'preview', or 'development'
    }

    if (process.env.NODE_ENV === 'production') {
        return 'production'
    }

    return 'development'
}

/**
 * Check if we're in production
 */
export function isProduction() {
    return getEnvironment() === 'production'
}
