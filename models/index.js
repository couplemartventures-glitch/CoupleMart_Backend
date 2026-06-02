// models/index.js  — single import point for all models
const sequelize = require('../config/database');
const { User, Address } = require('./User');
const { Product, ProductVariant, Review } = require('./Product');
const { Order, OrderItem } = require('./Order');

// Cross-model associations not defined in individual files:

// User → Orders
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → Reviews
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Product → OrderItems
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  User,
  Address,
  Product,
  ProductVariant,
  Review,
  Order,
  OrderItem
};