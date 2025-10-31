import {
    sendOrderConfirmationEmailNodemailer,
    sendNewOrderNotificationToAdminNodemailer,
    sendOrderStatusUpdateEmailNodemailer,
    sendNewReviewNotificationToAdminNodemailer
} from './email-service-nodemailer.js'

// Gmail SMTP Configuration - Only Email Service
const SENDER_EMAIL = process.env.GMAIL_USER || 'orbitcreativelab1@gmail.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'orbitcreativelab1@gmail.com'

console.log('📧 Gmail SMTP Email Service Initialized (ONLY SERVICE):')
console.log('📧 Sender Email:', SENDER_EMAIL)
console.log('📧 Admin Email:', ADMIN_EMAIL)
console.log('📧 Gmail User Configured:', process.env.GMAIL_USER ? 'Yes' : 'No')
console.log('📧 Gmail App Password Configured:', process.env.GMAIL_APP_PASSWORD ? 'Yes' : 'No')
console.log('✅ GMAIL SMTP ONLY: All emails sent via Gmail SMTP to actual recipients')

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(order, userEmail) {
    return await sendOrderConfirmationEmailNodemailer(order, userEmail)
}

/**
 * Send order status update email to customer
 */
export async function sendOrderStatusUpdateEmail(order, userEmail, oldStatus, newStatus) {
    return await sendOrderStatusUpdateEmailNodemailer(order, userEmail, oldStatus, newStatus)
}

/**
 * Send new order notification email to admin
 */
export async function sendNewOrderNotificationToAdmin(order, orderItems, customerProfile) {
    return await sendNewOrderNotificationToAdminNodemailer(order, orderItems, customerProfile)
}

/**
 * Send new review notification email to admin
 */
export async function sendNewReviewNotificationToAdmin(review, product, customerProfile) {
    return await sendNewReviewNotificationToAdminNodemailer(review, product, customerProfile)
}

// All email templates are now handled in email-service-nodemailer.js
