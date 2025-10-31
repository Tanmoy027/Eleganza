// Alternative email service for local development without domain restrictions
// Only import nodemailer on server-side
import nodemailer from 'nodemailer'

// Ensure this module only runs on server-side
if (typeof window !== 'undefined') {
  throw new Error('This module should only be imported on the server side')
}

// Create a test SMTP transporter using Ethereal Email (for testing)
let transporter = null

async function createTransporter() {
  if (!transporter) {
    // Use Gmail SMTP with app password
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      console.log('📧 [NODEMAILER] Configuring Gmail SMTP...')
      console.log('📧 [NODEMAILER] Gmail User:', process.env.GMAIL_USER)
      console.log('📧 [NODEMAILER] App Password Configured:', process.env.GMAIL_APP_PASSWORD ? 'Yes' : 'No')

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD // This should be an app password, not regular password
        }
      })

      console.log('✅ [NODEMAILER] Gmail SMTP transporter created successfully')
    } else {
      console.error('❌ [NODEMAILER] Gmail credentials not found!')
      console.error('❌ [NODEMAILER] Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file')
      throw new Error('Gmail SMTP credentials not configured')
    }
  }
  return transporter
}

/**
 * Send order confirmation email to customer using Nodemailer
 */
export async function sendOrderConfirmationEmailNodemailer(order, userEmail) {
  try {
    console.log('📧 [NODEMAILER] Attempting to send order confirmation email...')
    console.log('📧 [NODEMAILER] To:', userEmail)
    console.log('📧 [NODEMAILER] Order:', order.order_number)

    const transporter = await createTransporter()
    const senderEmail = process.env.GMAIL_USER || 'test@ethereal.email'

    const mailOptions = {
      from: `"Your Store" <${senderEmail}>`,
      to: userEmail,
      subject: `Order Confirmation - Order #${order.order_number}`,
      html: generateOrderConfirmationEmailHTML(order, userEmail)
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ [NODEMAILER] Order confirmation email sent successfully')
    console.log('📧 [NODEMAILER] Message ID:', info.messageId)
    console.log('📧 [NODEMAILER] Email sent to:', userEmail)

    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('❌ [NODEMAILER] Error sending order confirmation email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send admin notification email using Nodemailer
 */
export async function sendNewOrderNotificationToAdminNodemailer(order, orderItems, customerProfile) {
  try {
    console.log('📧 [NODEMAILER] Attempting to send admin notification email...')

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    console.log('📧 [NODEMAILER] To (Admin):', adminEmail)
    console.log('📧 [NODEMAILER] Order:', order.order_number)

    const transporter = await createTransporter()
    const senderEmail = process.env.GMAIL_USER || 'test@ethereal.email'

    const mailOptions = {
      from: `"Your Store Admin" <${senderEmail}>`,
      to: adminEmail,
      subject: `New Order Received - Order #${order.order_number}`,
      html: generateAdminOrderNotificationEmailHTML(order, orderItems, customerProfile)
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ [NODEMAILER] Admin notification email sent successfully')
    console.log('📧 [NODEMAILER] Message ID:', info.messageId)
    console.log('📧 [NODEMAILER] Email sent to admin:', adminEmail)

    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('❌ [NODEMAILER] Error sending admin notification email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send order status update email using Nodemailer
 */
export async function sendOrderStatusUpdateEmailNodemailer(order, userEmail, oldStatus, newStatus) {
  try {
    console.log('📧 [NODEMAILER] Attempting to send order status update email...')
    console.log('📧 [NODEMAILER] To:', userEmail)
    console.log('📧 [NODEMAILER] Order:', order.order_number)

    const transporter = await createTransporter()
    const senderEmail = process.env.GMAIL_USER || 'test@ethereal.email'

    const mailOptions = {
      from: `"Your Store" <${senderEmail}>`,
      to: userEmail,
      subject: `Order Update - Order #${order.order_number}`,
      html: generateOrderStatusUpdateEmailHTML(order, oldStatus, newStatus)
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ [NODEMAILER] Order status update email sent successfully')
    console.log('📧 [NODEMAILER] Message ID:', info.messageId)
    console.log('📧 [NODEMAILER] Email sent to:', userEmail)

    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('❌ [NODEMAILER] Error sending order status update email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send new review notification email to admin using Nodemailer
 */
export async function sendNewReviewNotificationToAdminNodemailer(review, product, customerProfile) {
  try {
    console.log('📧 [NODEMAILER] Attempting to send review notification email...')

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    console.log('📧 [NODEMAILER] To (Admin):', adminEmail)
    console.log('📧 [NODEMAILER] Product:', product.name)
    console.log('📧 [NODEMAILER] Review Rating:', review.rating)

    const transporter = await createTransporter()
    const senderEmail = process.env.GMAIL_USER || 'test@ethereal.email'

    const mailOptions = {
      from: `"Your Store Admin" <${senderEmail}>`,
      to: adminEmail,
      subject: `New Product Review - ${product.name} (${review.rating}★)`,
      html: generateAdminReviewNotificationEmailHTML(review, product, customerProfile)
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ [NODEMAILER] Review notification email sent successfully')
    console.log('📧 [NODEMAILER] Message ID:', info.messageId)
    console.log('📧 [NODEMAILER] Email sent to admin:', adminEmail)

    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('❌ [NODEMAILER] Error sending review notification email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send order cancellation notification email to admin using Nodemailer
 */
export async function sendOrderCancellationNotificationToAdminNodemailer(order, orderItems, customerProfile) {
  try {
    console.log('📧 [NODEMAILER] Attempting to send order cancellation notification email...')

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    console.log('📧 [NODEMAILER] To (Admin):', adminEmail)
    console.log('📧 [NODEMAILER] Cancelled Order:', order.order_number)

    const transporter = await createTransporter()
    const senderEmail = process.env.GMAIL_USER || 'test@ethereal.email'

    const mailOptions = {
      from: `"Your Store Admin" <${senderEmail}>`,
      to: adminEmail,
      subject: `Order Cancelled - Order #${order.order_number}`,
      html: generateAdminOrderCancellationEmailHTML(order, orderItems, customerProfile)
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ [NODEMAILER] Order cancellation notification email sent successfully')
    console.log('📧 [NODEMAILER] Message ID:', info.messageId)
    console.log('📧 [NODEMAILER] Email sent to admin:', adminEmail)

    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('❌ [NODEMAILER] Error sending order cancellation notification email:', error)
    return { success: false, error: error.message }
  }
}

// Email template functions (same as in the original email service)
function generateOrderConfirmationEmailHTML(order, userEmail) {
  const orderItems = order.order_items || []

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #000; }
        .order-info { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { margin: 20px 0; }
        .item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; margin-top: 15px; padding-top: 15px; border-top: 2px solid #000; text-align: right; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; text-transform: uppercase; }
        .status-confirmed { background-color: #22c55e; }
        .status-pending { background-color: #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Your Store</div>
          <h1>Order Confirmation</h1>
        </div>
        
        <p>Dear Customer,</p>
        <p>Thank you for your order! We're excited to get your items to you.</p>
        
        <div class="order-info">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></p>
          <p><strong>Payment Status:</strong> ${order.payment_status}</p>
        </div>

        <div class="order-items">
          <h3>Items Ordered</h3>
          ${orderItems.map(item => `
            <div class="item">
              <div>
                <strong>${item.product_name}</strong><br>
                <small>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</small><br>
                <small>Quantity: ${item.quantity}</small>
              </div>
              <div>৳${parseFloat(item.subtotal).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <p>Total: ৳${parseFloat(order.total_amount).toFixed(2)}</p>
        </div>

        <div class="footer">
          <p>We'll send you another email when your order ships.</p>
          <p>If you have any questions, please contact our customer support.</p>
          <p>&copy; 2024 Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateOrderStatusUpdateEmailHTML(order, oldStatus, newStatus) {
  const statusMessages = {
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is currently being processed.",
    shipped: "Great news! Your order has been shipped and is on its way to you.",
    delivered: "Your order has been delivered. We hope you love your purchase!",
    cancelled: "Your order has been cancelled. If you didn't request this, please contact support."
  }

  const statusMessage = statusMessages[newStatus.toLowerCase()] || "Your order status has been updated."

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: bold; color: #000; }
        .status-update { background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .order-info { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; text-transform: uppercase; }
        .status-confirmed { background-color: #22c55e; }
        .status-processing { background-color: #3b82f6; }
        .status-shipped { background-color: #8b5cf6; }
        .status-delivered { background-color: #10b981; }
        .status-cancelled { background-color: #ef4444; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Your Store</div>
          <h1>Order Status Update</h1>
        </div>
        
        <div class="status-update">
          <h3>🔄 Status Update</h3>
          <p>${statusMessage}</p>
          <p><strong>New Status:</strong> <span class="status-badge status-${newStatus.toLowerCase()}">${newStatus}</span></p>
        </div>
        
        <div class="order-info">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Total:</strong> ৳${parseFloat(order.total_amount).toFixed(2)}</p>
        </div>

        <div class="footer">
          <p>Track your order status anytime by visiting your account.</p>
          <p>If you have any questions, please contact our customer support.</p>
          <p>&copy; 2024 Your Store. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAdminOrderNotificationEmailHTML(order, orderItems, customerProfile) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Received</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dc2626; padding-bottom: 20px; background-color: #fef2f2; padding: 20px; border-radius: 8px; }
        .logo { font-size: 28px; font-weight: bold; color: #dc2626; }
        .alert { background-color: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0; }
        .customer-info, .order-info { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { margin: 20px 0; }
        .item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; margin-top: 15px; padding-top: 15px; border-top: 2px solid #dc2626; text-align: right; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; text-transform: uppercase; background-color: #22c55e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🛍️ Admin Dashboard</div>
          <h1>New Order Received!</h1>
        </div>
        
        <div class="alert">
          <h3>🎉 Great news! You have a new order to process.</h3>
        </div>
        
        <div class="customer-info">
          <h3>👤 Customer Information</h3>
          <p><strong>Name:</strong> ${customerProfile?.full_name || 'Guest Customer'}</p>
          <p><strong>Email:</strong> ${customerProfile?.email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
        </div>

        <div class="order-info">
          <h3>📦 Order Details</h3>
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span class="status-badge">${order.status}</span></p>
          <p><strong>Payment Status:</strong> ${order.payment_status}</p>
        </div>

        <div class="order-items">
          <h3>🛒 Items Ordered</h3>
          ${orderItems.map(item => `
            <div class="item">
              <div>
                <strong>${item.product_name}</strong><br>
                <small>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</small><br>
                <small>Quantity: ${item.quantity} × ৳${parseFloat(item.product_price || 0).toFixed(2)}</small>
              </div>
              <div><strong>৳${parseFloat(item.subtotal || 0).toFixed(2)}</strong></div>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <p>Total Order Value: ৳${parseFloat(order.total_amount).toFixed(2)}</p>
        </div>

        <div class="footer">
          <p><strong>Action Required:</strong> Please process this order in your admin dashboard.</p>
          <p>Order ID: ${order.id}</p>
          <p>&copy; 2024 Your Store Admin System</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAdminReviewNotificationEmailHTML(review, product, customerProfile) {
  const starRating = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Product Review Received</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; background-color: #eff6ff; padding: 20px; border-radius: 8px; }
        .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
        .alert { background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .product-info, .review-info, .customer-info { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .rating { font-size: 24px; color: #fbbf24; margin: 10px 0; }
        .review-text { background-color: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; font-style: italic; margin: 15px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; text-transform: uppercase; }
        .verified-badge { background-color: #22c55e; }
        .rating-badge { background-color: #fbbf24; color: #000; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⭐ Review Alert</div>
          <h1>New Product Review Received!</h1>
        </div>
        
        <div class="alert">
          <h3>📝 A customer has left a new review for one of your products.</h3>
        </div>
        
        <div class="product-info">
          <h3>🛍️ Product Information</h3>
          <p><strong>Product Name:</strong> ${product.name}</p>
          <p><strong>Price:</strong> ৳${product.discount_price ? parseFloat(product.discount_price).toFixed(2) : parseFloat(product.price).toFixed(2)}</p>
          ${product.discount_price ? `<p><strong>Original Price:</strong> ৳${parseFloat(product.price).toFixed(2)}</p>` : ''}
        </div>

        <div class="review-info">
          <h3>⭐ Review Details</h3>
          <div class="rating">
            <span class="rating-badge">${review.rating}/5 Stars</span>
            <div style="font-size: 32px; margin: 10px 0;">${starRating}</div>
          </div>
          
          <div class="review-text">
            <p><strong>Customer Review:</strong></p>
            <p>"${review.review_text}"</p>
          </div>
          
          <p><strong>Review Date:</strong> ${new Date(review.created_at).toLocaleDateString()}</p>
          ${review.is_verified_purchase ? '<p><span class="status-badge verified-badge">✓ Verified Purchase</span></p>' : ''}
        </div>

        <div class="customer-info">
          <h3>👤 Customer Information</h3>
          <p><strong>Name:</strong> ${customerProfile?.full_name || 'Anonymous Customer'}</p>
          <p><strong>Email:</strong> ${customerProfile?.email || 'N/A'}</p>
        </div>

        <div class="footer">
          <p><strong>Action Available:</strong> You can moderate this review in your admin dashboard if needed.</p>
          <p>Review ID: ${review.id}</p>
          <p>&copy; 2024 Your Store Review System</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAdminOrderCancellationEmailHTML(order, orderItems, customerProfile) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancelled</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #dc2626; padding-bottom: 20px; background-color: #fef2f2; padding: 20px; border-radius: 8px; }
        .logo { font-size: 28px; font-weight: bold; color: #dc2626; }
        .alert { background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0; }
        .customer-info, .order-info { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-items { margin: 20px 0; }
        .item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 18px; margin-top: 15px; padding-top: 15px; border-top: 2px solid #dc2626; text-align: right; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; text-transform: uppercase; background-color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🛍️ Admin Dashboard</div>
          <h1>Order Cancelled</h1>
        </div>
        
        <div class="alert">
          <h3>❌ A customer has cancelled their order</h3>
          <p>This order has been cancelled by the customer and removed from active orders.</p>
        </div>
        
        <div class="customer-info">
          <h3>👤 Customer Information</h3>
          <p><strong>Name:</strong> ${customerProfile?.full_name || 'Guest Customer'}</p>
          <p><strong>Email:</strong> ${customerProfile?.email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
        </div>

        <div class="order-info">
          <h3>📦 Cancelled Order Details</h3>
          <p><strong>Order Number:</strong> ${order.order_number}</p>
          <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span class="status-badge">CANCELLED</span></p>
          <p><strong>Payment Status:</strong> ${order.payment_status}</p>
          <p><strong>Total Amount:</strong> ৳${parseFloat(order.total_amount).toFixed(2)}</p>
        </div>

        <div class="order-items">
          <h3>🛍️ Cancelled Items</h3>
          ${orderItems && orderItems.length > 0 ? orderItems.map(item => `
            <div class="item">
              <div>
                <strong>${item.product_name}</strong><br>
                <small>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</small><br>
                <small>Qty: ${item.quantity} × ৳${parseFloat(item.product_price).toFixed(2)}</small>
              </div>
              <div>
                <strong>৳${parseFloat(item.subtotal).toFixed(2)}</strong>
              </div>
            </div>
          `).join('') : '<p>No items found</p>'}
        </div>

        <div class="total">
          Total Cancelled Amount: ৳${parseFloat(order.total_amount).toFixed(2)}
        </div>

        ${order.shipping_address ? `
        <div class="customer-info">
          <h3>📍 Shipping Address (Cancelled)</h3>
          <p>${order.shipping_address.fullName || 'N/A'}</p>
          <p>${order.shipping_address.address || 'N/A'}</p>
          <p>${order.shipping_address.city || 'N/A'}, ${order.shipping_address.state || 'N/A'} ${order.shipping_address.zipCode || 'N/A'}</p>
          ${order.shipping_address.phone ? `<p>Phone: ${order.shipping_address.phone}</p>` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>Note:</strong> This order has been cancelled by the customer. No further action is required unless refund processing is needed.</p>
          <p>Order ID: ${order.id}</p>
          <p>&copy; 2024 Your Store Admin System</p>
        </div>
      </div>
    </body>
    </html>
  `
}
