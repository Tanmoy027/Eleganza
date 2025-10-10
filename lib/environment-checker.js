/**
 * Environment checker utility
 * Helps detect configuration issues that could cause redirect problems
 */

export function getEnvironmentInfo() {
    return {
        nodeEnv: process.env.NODE_ENV,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        isProduction: process.env.NODE_ENV === 'production',
        isVercel: !!process.env.VERCEL,
        isNetlify: !!process.env.NETLIFY,
        vercelUrl: process.env.VERCEL_URL,
        netlifyUrl: process.env.URL,
    }
}

export function checkEnvironmentConfiguration() {
    const env = getEnvironmentInfo()
    const warnings = []
    const errors = []

    // Check if NEXT_PUBLIC_SITE_URL is set
    if (!env.siteUrl) {
        if (env.isProduction) {
            errors.push('NEXT_PUBLIC_SITE_URL is not set in production environment')
        } else {
            warnings.push('NEXT_PUBLIC_SITE_URL is not set (okay for development)')
        }
    }

    // Check if using localhost in production
    if (env.isProduction && env.siteUrl?.includes('localhost')) {
        errors.push('NEXT_PUBLIC_SITE_URL points to localhost in production')
    }

    // Check if protocol is correct
    if (env.siteUrl && env.isProduction && !env.siteUrl.startsWith('https://')) {
        warnings.push('Production site URL should use HTTPS')
    }

    return {
        env,
        warnings,
        errors,
        isValid: errors.length === 0,
    }
}

export function logEnvironmentStatus() {
    const check = checkEnvironmentConfiguration()

    console.log('🌍 Environment Configuration:')
    console.log('NODE_ENV:', check.env.nodeEnv)
    console.log('NEXT_PUBLIC_SITE_URL:', check.env.siteUrl || 'NOT SET')

    if (check.env.isVercel) {
        console.log('🚀 Detected: Vercel deployment')
        console.log('VERCEL_URL:', check.env.vercelUrl)
    }

    if (check.env.isNetlify) {
        console.log('🚀 Detected: Netlify deployment')
        console.log('URL:', check.env.netlifyUrl)
    }

    if (check.warnings.length > 0) {
        console.log('⚠️ Warnings:')
        check.warnings.forEach(warning => console.log(`  - ${warning}`))
    }

    if (check.errors.length > 0) {
        console.log('❌ Errors:')
        check.errors.forEach(error => console.log(`  - ${error}`))
    }

    if (check.isValid) {
        console.log('✅ Environment configuration looks good!')
    }

    return check
}
