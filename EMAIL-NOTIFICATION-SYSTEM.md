# Email Notification System Documentation

## Overview
The email notification system provides automated email notifications for order status updates and new purchases. It uses Resend as the email service provider.

## Features Implemented

### 1. Order Confirmation Emails (For Customers)
- **Trigger**: Sent automatically when a customer completes a purchase (via Stripe webhook)
- **Recipient**: Customer's email address from their profile
- **Content**: 
  - Order confirmation details
  - Order number and date
  - List of purchased items with quantities and prices
  - Total amount
  - Order status
  - Payment status

### 2. Order Status Update Emails (For Customers)
- **Trigger**: Sent when admin updates order status through admin panel
- **Recipient**: Customer's email address from their profile
- **Content**:
  - Status change notification
  - Order details
  - Status-specific messages (confirmed, processing, shipped, delivered, cancelled)
  - Order tracking information

### 3. New Order Notification Emails (For Admin)
- **Trigger**: Sent automatically when a new order is placed (via Stripe webhook)
- **Recipient**: Admin email address (configured via environment variable)
- **Content**:
  - New order alert
  - Complete customer information
  - Full order details with items
  - Shipping address
  - Customer contact information
  - Order value and payment status

## Technical Implementation

### Files Created/Modified

1. **lib/email-service.js** (Updated)
   - Contains all email sending functions
   - HTML email templates
   - Error handling for email failures
   - Currency formatting updated to Bangladeshi Taka (৳)

2. **app/api/admin/orders/update-status/route.js** (New)
   - API endpoint for admin order status updates
   - Handles authentication and authorization
   - Sends status update emails to customers
   - Maintains order tracking history

3. **components/admin/order-status-update.jsx** (Updated)
   - Updated to use new API endpoint instead of direct database updates
   - Improved error handling and user feedback

4. **app/api/webhooks/stripe/route.js** (Updated)
   - Already sends confirmation emails to customers
   - Already sends new order notifications to admin
   - Fixed syntax error

### Email Templates

All email templates are responsive and include:
- Professional styling with inline CSS
- Order details formatting
- Status badges with color coding
- Company branding placeholder
- Customer-friendly messaging

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=your_resend_api_key

# Email Configuration
SENDER_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

## Setup Instructions

1. **Get Resend API Key**
   - Sign up at [resend.com](https://resend.com)
   - Create an API key
   - Add it to your environment variables

2. **Configure Email Addresses**
   - Set `SENDER_EMAIL` to your verified domain email
   - Set `ADMIN_EMAIL` to receive new order notifications

3. **Domain Verification**
   - Verify your domain in Resend dashboard
   - Update sender email to use verified domain

## Email Flows

### Purchase Flow
1. Customer completes checkout
2. Stripe webhook triggers
3. Order status updated to "confirmed"
4. Customer receives order confirmation email
5. Admin receives new order notification email

### Status Update Flow
1. Admin updates order status in admin panel
2. API endpoint processes the update
3. Database updated with new status and tracking entry
4. Customer receives status update email with personalized message

## Status Messages

The system includes predefined messages for each status:
- **Confirmed**: "Your order has been confirmed and is being prepared."
- **Processing**: "Your order is currently being processed."
- **Shipped**: "Great news! Your order has been shipped and is on its way to you."
- **Delivered**: "Your order has been delivered. We hope you love your purchase!"
- **Cancelled**: "Your order has been cancelled. If you didn't request this, please contact support."

## Error Handling

- Email failures don't break the order process
- Errors are logged to console for debugging
- Fallback behavior ensures orders are still processed even if emails fail
- API includes proper error responses for admin interface

## Security Features

- Admin authentication required for status updates
- Role-based access control (admin role required)
- Input validation for all API endpoints
- Service role client used for database operations in webhooks

## Customization

To customize email templates:
1. Edit the HTML template functions in `lib/email-service.js`
2. Update styling in the inline CSS
3. Modify email content and messaging
4. Add your company logo and branding

## Testing

To test the email system:
1. Place a test order to verify confirmation emails
2. Update order status in admin panel to test status update emails
3. Check both customer and admin email addresses
4. Monitor console logs for any email delivery issues

## Troubleshooting

Common issues:
- **Emails not sending**: Check Resend API key and domain verification
- **Wrong sender address**: Verify domain in Resend dashboard
- **Admin not receiving emails**: Check ADMIN_EMAIL environment variable
- **Customer not receiving emails**: Verify customer has email in profile

## Currency Display

All email templates display prices in Bangladeshi Taka (৳) to match the application's regional requirements.
