const { Resend } = require('resend');
const EventEmitter = require('events');
const emitter = new EventEmitter();

const resend = new Resend('re_V2iViW5h_Cf6D4crYtbtHtWP5336QmZHN');

async function sendEmail(subject, html, to = 'couplemartventures@gmail.com') {
  try {
    await resend.emails.send({
        from: 'CoupleMart <noreply@couplemart.in>',
      to,
      subject,
      html,
    });
    console.log('✅ Email sent to', to);
  } catch (err) {
    console.error('❌ Email Error:', err.message);
  }
}

// In-memory notification store
let notifications = [];
let notifIdSeq = 1;

function pushNotification({ type, title, body, orderId, meta = {} }) {
  const n = {
    id: notifIdSeq++,
    type,
    title,
    body,
    orderId,
    meta,
    read: false,
    createdAt: new Date(),
  };
  notifications.unshift(n);
  if (notifications.length > 200) notifications = notifications.slice(0, 200);
  emitter.emit('notification', n);
  return n;
}

async function notifyNewOrder(order) {
  pushNotification({
    type: 'order_new',
    title: '🛒 New Order Received',
    body: `Order #${order.orderNumber} • ₹${order.totalAmount}`,
    orderId: order.id,
  });

  console.log('📧 Sending admin email...');
  await sendEmail(
    `New CoupleMart Order ${order.orderNumber}`,
    `
      <h2>🛒 New Order Received</h2>
      <p><b>Order Number:</b> ${order.orderNumber}</p>
      <p><b>Amount:</b> ₹${order.totalAmount}</p>
      <p><b>Payment Method:</b> ${order.paymentMethod}</p>
      <p><b>Customer:</b> ${order.customerName || 'N/A'} (${order.customerEmail || 'N/A'})</p>
    `
  );

  if (order.customerEmail) {
    console.log('📧 Sending customer email to', order.customerEmail);
    await sendEmail(
      `🎉 Order Confirmed | ${order.orderNumber} | CoupleMart`,
      `<!DOCTYPE html>
      <html>
      <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:30px 15px;">
      <tr><td align="center">
      <table width="650" cellpadding="0" cellspacing="0" style="max-width:650px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 35px rgba(0,0,0,.08);">
      
      <tr>
      <td align="center" style="background:linear-gradient(135deg,#e11d48,#fb7185);padding:40px 20px;">
      <h1 style="margin:0;color:#fff;font-size:34px;font-weight:800;">❤️ CoupleMart</h1>
      <p style="margin:10px 0 0;color:#ffe4e6;font-size:15px;">Made for Couples • Made with Love</p>
      </td>
      </tr>
      
      <tr>
      <td style="padding:40px 35px;">
      <h2 style="margin:0;color:#111827;font-size:28px;">🎉 Order Confirmed!</h2>
      <p style="font-size:16px;color:#4b5563;line-height:1.8;">Hello <strong>${order.customerName || 'Customer'}</strong>,</p>
      <p style="font-size:16px;color:#4b5563;line-height:1.8;">Thank you for shopping with CoupleMart. Your order has been successfully placed and is now being prepared.</p>
      </td>
      </tr>
      
      <tr>
      <td style="padding:0 35px 30px;">
      <table width="100%" style="background:#f9fafb;border-radius:14px;padding:20px;">
      <tr><td>
      <h3 style="margin-top:0;color:#111827;">📦 Order Details</h3>
      <p style="margin:8px 0;color:#374151;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p style="margin:8px 0;color:#374151;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
      <p style="margin:8px 0;color:#374151;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
      <p style="margin:8px 0;color:#374151;"><strong>Total Amount:</strong> <span style="color:#e11d48;font-size:20px;font-weight:700;">₹${order.totalAmount}</span></p>
      </td></tr>
      </table>
      </td>
      </tr>
      
      <tr>
      <td style="padding:0 35px 30px;">
      <table width="100%" style="border:1px solid #e5e7eb;border-radius:14px;padding:20px;">
      <tr><td>
      <h3 style="margin-top:0;color:#111827;">🚚 Delivery Address</h3>
      <p style="margin:6px 0;color:#4b5563;">${order.shippingAddress?.name || ''}</p>
      <p style="margin:6px 0;color:#4b5563;">${order.shippingAddress?.addressLine1 || ''}</p>
      <p style="margin:6px 0;color:#4b5563;">${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}</p>
      <p style="margin:6px 0;color:#4b5563;">${order.shippingAddress?.pincode || ''}</p>
      </td></tr>
      </table>
      </td>
      </tr>
      
      <tr>
      <td style="padding:0 35px 30px;">
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:18px;border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:16px;font-weight:700;color:#059669;">✅ Your order is confirmed and being processed.</p>
      </div>
      </td>
      </tr>
      
      <tr>
      <td align="center" style="padding:10px 35px 40px;">
      <a href="https://couplemart.in/orders" style="background:#e11d48;color:#fff;text-decoration:none;padding:15px 35px;border-radius:999px;font-weight:700;display:inline-block;font-size:16px;">View My Orders</a>
      </td>
      </tr>
      
      <tr>
      <td style="background:#111827;padding:35px;text-align:center;">
      <h3 style="margin:0;color:white;">❤️ CoupleMart</h3>
      <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin-top:12px;">Thank you for choosing CoupleMart.<br>We'll notify you again when your order ships.</p>
      <p style="color:#6b7280;font-size:12px;margin-top:20px;">© ${new Date().getFullYear()} CoupleMart. All Rights Reserved.</p>
      </td>
      </tr>
      
      </table>
      </td></tr>
      </table>
      </body>
      </html>`,
      order.customerEmail
    );
  } else {
    console.log('❌ No customer email found');
  }

  console.log('✅ All emails sent');
}

async function notifyPaymentSuccess(order) {
  const notification = pushNotification({
    type: 'order_paid',
    title: '✅ Payment Confirmed',
    body: `Order #${order.orderNumber} • ₹${order.totalAmount} paid via Razorpay`,
    orderId: order.id,
    meta: { amount: order.totalAmount, razorpayPaymentId: order.razorpayPaymentId },
  });

  await sendEmail(
    `New Order ${order.orderNumber}`,
    `<h2>New CoupleMart Order</h2>
     <p>Order Number: ${order.orderNumber}</p>
     <p>Amount: ₹${order.totalAmount}</p>
     <p>Status: Paid</p>`
  );

  return notification;
}

function notifyPaymentFailed(orderId, orderNumber) {
  return pushNotification({
    type: 'order_failed',
    title: '❌ Payment Failed',
    body: `Order #${orderNumber} payment was not completed`,
    orderId,
  });
}

function notifyDeliveryAssigned(order, partner) {
  return pushNotification({
    type: 'delivery_assigned',
    title: '🚚 Delivery Assigned',
    body: `Order #${order.orderNumber} assigned to ${partner.name} (${partner.trackingId})`,
    orderId: order.id,
    meta: { partner },
  });
}

function getNotifications({ unreadOnly = false } = {}) {
  return unreadOnly ? notifications.filter(n => !n.read) : notifications;
}

function markRead(ids) {
  ids.forEach(id => {
    const n = notifications.find(n => n.id === id);
    if (n) n.read = true;
  });
}

function markAllRead() {
  notifications.forEach(n => { n.read = true; });
}

module.exports = {
  emitter,
  sendEmail,
  notifyNewOrder,
  notifyPaymentSuccess,
  notifyPaymentFailed,
  notifyDeliveryAssigned,
  getNotifications,
  markRead,
  markAllRead,
};