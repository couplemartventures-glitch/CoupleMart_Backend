// models/Order.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── Order ────────────────────────────────────────────────────────────────────
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'RESTRICT'          // don't delete orders when user is deleted
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true
  },

  // ── Payment ────────────────────────────────────────────────────────────────
  paymentMethod: {
    type: DataTypes.ENUM('razorpay', 'cod'),
    defaultValue: 'razorpay'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  razorpayOrderId:   { type: DataTypes.STRING },
  razorpayPaymentId: { type: DataTypes.STRING },
  razorpaySignature: { type: DataTypes.STRING },

  // ── Status ─────────────────────────────────────────────────────────────────
  orderStatus: {
    type: DataTypes.ENUM(
      'placed', 'confirmed', 'processing', 'shipped',
      'out_for_delivery', 'delivered', 'cancelled', 'returned'
    ),
    defaultValue: 'placed'
  },
  trackingNumber: { type: DataTypes.STRING },
  courier:        { type: DataTypes.STRING },

  // ── Financials ─────────────────────────────────────────────────────────────
  itemsTotal:     { type: DataTypes.DECIMAL(10, 2) },
  shippingCharge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount:       { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  totalAmount:    { type: DataTypes.DECIMAL(10, 2) },

  // ── Shipping Address (embedded JSON — no separate table needed) ─────────────
  shippingAddress: {
    type: DataTypes.JSONB,      // JSONB = indexed JSON in PostgreSQL
    defaultValue: {}
    /*
      Stored as: {
        name, phone, addressLine1, addressLine2, city, state, pincode
      }
    */
  },

  // ── Status History (array of {status, timestamp, note}) ─────────────────────
  statusHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  // ── Dates ──────────────────────────────────────────────────────────────────
  estimatedDelivery: { type: DataTypes.DATE },
  deliveredAt:       { type: DataTypes.DATE },
  cancelReason:      { type: DataTypes.STRING }
}, {
  tableName: 'orders',
  timestamps: true,
  hooks: {
    // Auto-generate order number before create (same logic as Mongoose pre-save)
    beforeCreate: (order) => {
      if (!order.orderNumber) {
        order.orderNumber =
          'CM' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
      }
      // Seed initial status history entry
      order.statusHistory = [{
        status: order.orderStatus || 'placed',
        timestamp: new Date(),
        note: 'Order placed'
      }];
    }
  }
});

// ─── OrderItem ────────────────────────────────────────────────────────────────
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'orders', key: 'id' },
    onDelete: 'CASCADE'
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: true,           // ← was missing, causes FK crash on null/mismatch
    references: { model: 'products', key: 'id' },
    onDelete: 'SET NULL'
  },
  name:     { type: DataTypes.STRING },
  image:    { type: DataTypes.STRING },
  price:    { type: DataTypes.DECIMAL(10, 2) },
  quantity: { type: DataTypes.INTEGER },
  size:     { type: DataTypes.STRING },
  color:    { type: DataTypes.STRING }
}, {
  tableName: 'order_items',
  timestamps: false
});

// ─── Associations ─────────────────────────────────────────────────────────────
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = { Order, OrderItem };