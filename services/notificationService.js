// services/notificationService.js
// Handles admin notifications after order events
// Works in-memory + can be extended with email/SMS/push

const EventEmitter = require('events');
const emitter = new EventEmitter();

// In-memory notification store (swap with DB table for production)
let notifications = [];
let notifIdSeq = 1;

function pushNotification({ type, title, body, orderId, meta = {} }) {
  const n = {
    id: notifIdSeq++,
    type,       // 'order_new' | 'order_paid' | 'order_failed' | 'delivery_assigned'
    title,
    body,
    orderId,
    meta,
    read: false,
    createdAt: new Date(),
  };
  notifications.unshift(n);
  if (notifications.length > 200) notifications = notifications.slice(0, 200); // cap
  emitter.emit('notification', n);
  return n;
}

// Convenience helpers
function notifyNewOrder(order) {
  return pushNotification({
    type: 'order_new',
    title: '🛒 New Order Received',
    body: `Order #${order.orderNumber} • ₹${order.totalAmount} • ${order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'}`,
    orderId: order.id,
    meta: { amount: order.totalAmount, paymentMethod: order.paymentMethod },
  });
}

function notifyPaymentSuccess(order) {
  return pushNotification({
    type: 'order_paid',
    title: '✅ Payment Confirmed',
    body: `Order #${order.orderNumber} • ₹${order.totalAmount} paid via Razorpay`,
    orderId: order.id,
    meta: { amount: order.totalAmount, razorpayPaymentId: order.razorpayPaymentId },
  });
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

module.exports = { emitter, notifyNewOrder, notifyPaymentSuccess, notifyPaymentFailed, notifyDeliveryAssigned, getNotifications, markRead, markAllRead };