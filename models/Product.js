// models/Product.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── Product ─────────────────────────────────────────────────────────────────
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name:         { type: DataTypes.STRING,  allowNull: false },
  description:  { type: DataTypes.TEXT,    allowNull: false },
  price:        { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  originalPrice:{ type: DataTypes.DECIMAL(10, 2) },
  discount:     { type: DataTypes.INTEGER, defaultValue: 0 },

  // Replaces Mongoose enum-like string fields
  category: {
    type: DataTypes.ENUM('MENS', 'WOMENS', 'COUPLE COLLECTION'),
    allowNull: false
  },
  subCategory: { type: DataTypes.STRING },  // PLAIN T SHIRT, PRINTED T SHIRT, etc.

  // Images stored as a PostgreSQL text array
  images: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },

  // Tags stored as a text array
  tags: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },

  brand:           { type: DataTypes.STRING, defaultValue: 'CoupleMart' },
  rating:          { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  numReviews:      { type: DataTypes.INTEGER, defaultValue: 0 },
  isFeatured:      { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive:        { type: DataTypes.BOOLEAN, defaultValue: true },
  isCoupleSet:     { type: DataTypes.BOOLEAN, defaultValue: false },
  fabric:          { type: DataTypes.STRING },
  fit:             { type: DataTypes.STRING },
  careInstructions:{ type: DataTypes.STRING }
}, {
  tableName: 'products',
  timestamps: true,
  hooks: {
    // Auto-calculate discount % when saving
    beforeSave: (product) => {
      if (product.originalPrice && product.originalPrice > product.price) {
        product.discount = Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        );
      }
    }
  }
});

// ─── ProductVariant ───────────────────────────────────────────────────────────
const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'products', key: 'id' },
    onDelete: 'CASCADE'
  },
  size:  { type: DataTypes.STRING },
  color: { type: DataTypes.STRING },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  sku:   { type: DataTypes.STRING }
}, {
  tableName: 'product_variants',
  timestamps: false
});

// ─── Review ───────────────────────────────────────────────────────────────────
const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'products', key: 'id' },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  name:    { type: DataTypes.STRING },
  rating:  { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT }
}, {
  tableName: 'reviews',
  timestamps: true
});

// ─── Associations ─────────────────────────────────────────────────────────────
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId' });

Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });

module.exports = { Product, ProductVariant, Review };