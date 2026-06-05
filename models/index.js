// models/index.js  — single import point for all models
const sequelize = require('../config/database');
const { User, Address }              = require('./User');
const { Product, ProductVariant, Review } = require('./Product');
const { Order, OrderItem }           = require('./Order');
const Wishlist                       = require('./Wishlist');   // ← NEW

// ── User → Orders ─────────────────────────────────────────────────────────────
User.hasMany(Order,  { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── User → Reviews ────────────────────────────────────────────────────────────
User.hasMany(Review,   { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Product → OrderItems ──────────────────────────────────────────────────────
Product.hasMany(OrderItem,   { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ── User → Wishlist ───────────────────────────────────────────────────────────
User.hasMany(Wishlist,    { foreignKey: 'userId',    as: 'wishlists', onDelete: 'CASCADE' });
Wishlist.belongsTo(User,  { foreignKey: 'userId' });

// ── Product → Wishlist ────────────────────────────────────────────────────────
Product.hasMany(Wishlist,      { foreignKey: 'productId', as: 'wishlists', onDelete: 'CASCADE' });
Wishlist.belongsTo(Product,    { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  User,
  Address,
  Product,
  ProductVariant,
  Review,
  Order,
  OrderItem,
  Wishlist,   // ← NEW
};