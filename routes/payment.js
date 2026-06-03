 // key_id: "rzp_test_SwNLI0xqtk2GaQ",
  //key_secret: "bY15PJmQdY3i7BvNjVPi5rtU"

// routes/payment.js  — full replacement (adds notifications)
require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Order } = require('../models/Order');
const { protect } = require('../middleware/auth');
const { notifyPaymentSuccess, notifyPaymentFailed } = require('../services/notificationService');

const router = express.Router();

const razorpay = new Razorpay({
  key_id:    process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId || `cm_${Date.now()}`,
      notes: { shopName: 'CoupleMart' },
    });
    res.json({ razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/payment/verify
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // Signature check
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expected !== razorpaySignature) {
      // try to find order for notification
      const failOrder = await Order.findByPk(orderId).catch(() => null);
      if (failOrder) notifyPaymentFailed(failOrder.id, failOrder.orderNumber);
      return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await order.update({
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      statusHistory: [...(order.statusHistory || []), {
        status: 'confirmed',
        timestamp: new Date(),
        note: `Payment confirmed via Razorpay | PaymentID: ${razorpayPaymentId}`,
      }],
    });

    console.log('Payment success notification triggered');
    notifyPaymentSuccess(order);

    res.json({ message: 'Payment verified successfully', orderId: order.id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/payment/key
router.get('/key', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;