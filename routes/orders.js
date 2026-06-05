// routes/orders.js  — full replacement
const express = require('express');
const { Op } = require('sequelize');
const { Order } = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');
const { notifyNewOrder, notifyDeliveryAssigned } = require('./Notification');

const router = express.Router();

// ── DELIVERY PARTNERS CONFIG ─────────────────────────────────────────────────
// Add / remove partners freely; trackingUrlTemplate uses {trackingId}
const DELIVERY_PARTNERS = [
  { id: 'ekart',     name: 'Ekart Logistics',   trackingUrlTemplate: 'https://ekartlogistics.com/track?awb={trackingId}' },
  { id: 'delhivery', name: 'Delhivery',          trackingUrlTemplate: 'https://www.delhivery.com/track/package/{trackingId}' },
  { id: 'dtdc',      name: 'DTDC',               trackingUrlTemplate: 'https://www.dtdc.in/trace.asp?cnno={trackingId}' },
  { id: 'bluedart',  name: 'Blue Dart',          trackingUrlTemplate: 'https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo={trackingId}' },
  { id: 'shadowfax', name: 'Shadowfax',          trackingUrlTemplate: 'https://tracker.shadowfax.in/?awb={trackingId}' },
  { id: 'xpressbees',name: 'XpressBees',         trackingUrlTemplate: 'https://www.xpressbees.com/track?awb={trackingId}' },
  { id: 'shiprocket', name: 'Shiprocket',        trackingUrlTemplate: 'https://app.shiprocket.in/tracking/{trackingId}' },
  { id: 'other',     name: 'Other / Manual',     trackingUrlTemplate: '' },
];

// ── CUSTOMER ROUTES ───────────────────────────────────────────────────────────

// POST /api/orders  — create order
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, itemsTotal, shippingCharge, discount, totalAmount } = req.body;

    const orderNumber = `CM${Date.now()}`;
    const order = await Order.create({
      orderNumber,
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      itemsTotal,
      shippingCharge: shippingCharge || 0,
      discount: discount || 0,
      totalAmount,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending_payment',
      statusHistory: [{ status: paymentMethod === 'cod' ? 'confirmed' : 'pending_payment', timestamp: new Date(), note: 'Order created' }],
    });

    console.log('User Name:', req.user.name);
    console.log('User Email:', req.user.email);
    
    // 🔔 Fire admin + customer notification
    await notifyNewOrder({...order.toJSON()});
 

    res.status(201).json(order.toJSON());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/my — current user's orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/:id — single order (owner or admin)
router.get('/:id', protect, async (req, res) => {
  console.log('🔍 getById called with id:', req.params.id, '| user:', req.user?.id);
  try {
    const order = await Order.findByPk(req.params.id);
    console.log('📦 Found order:', order?.id, '| order.userId:', order?.userId);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Forbidden' });
    
    res.json(order);
  } catch (err) {
    console.error('❌ getById error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/cancel — customer cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus))
      return res.status(400).json({ message: `Cannot cancel an order that is already ${order.orderStatus}` });

    await order.update({
      orderStatus: 'cancelled',
      statusHistory: [...(order.statusHistory || []), { status: 'cancelled', timestamp: new Date(), note: req.body.reason || 'Cancelled by customer' }],
    });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/orders  — all orders (admin, with pagination + filters)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
    const where = {};
    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) where.orderNumber = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Order.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
    });
    res.json({ total: count, page: Number(page), pages: Math.ceil(count / limit), orders: rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/orders/:id/status  — admin update order status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['pending_payment','confirmed','processing','shipped','delivered','cancelled','refunded'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await order.update({
      orderStatus: status,
      statusHistory: [...(order.statusHistory || []), { status, timestamp: new Date(), note: note || `Status updated to ${status}` }],
    });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/orders/:id/assign-delivery  — assign delivery partner
router.put('/:id/assign-delivery', protect, adminOnly, async (req, res) => {
  try {
    const { partnerId, trackingId, estimatedDelivery } = req.body;
    if (!partnerId || !trackingId)
      return res.status(400).json({ message: 'partnerId and trackingId are required' });

    const partner = DELIVERY_PARTNERS.find(p => p.id === partnerId);
    if (!partner) return res.status(400).json({ message: 'Unknown delivery partner' });

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const trackingUrl = partner.trackingUrlTemplate
      ? partner.trackingUrlTemplate.replace('{trackingId}', trackingId)
      : null;

    await order.update({
      deliveryPartner: partner.name,
      deliveryPartnerId: partner.id,
      trackingId,
      trackingUrl,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      orderStatus: 'shipped',
      statusHistory: [...(order.statusHistory || []), {
        status: 'shipped',
        timestamp: new Date(),
        note: `Assigned to ${partner.name} | AWB: ${trackingId}`,
      }],
    });

    // 🔔 Notify admin log
    notifyDeliveryAssigned(order, { name: partner.name, trackingId, trackingUrl });

    res.json({ ...order.toJSON(), deliveryPartner: partner.name, trackingId, trackingUrl });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/meta/partners  — list available delivery partners
router.get('/meta/partners', protect, adminOnly, (req, res) => {
  res.json(DELIVERY_PARTNERS);
});

module.exports = router;