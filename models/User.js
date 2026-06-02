// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

// ─── User ────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) { this.setDataValue('email', value.toLowerCase()); }
  },
  phone: {
    type: DataTypes.STRING
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('customer', 'admin'),
    defaultValue: 'customer'
  },
  // Wishlist stored as array of product UUIDs (denormalized for simplicity)
  // Alternatively, create a separate WishlistItem table
  wishlist: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,            // adds createdAt / updatedAt
  underscored: false,
  hooks: {
    // Hash password before create or update
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance method — same API as the Mongoose version
User.prototype.comparePassword = async function(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// ─── Address (separate table — replaces embedded addressSchema) ───────────────
const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  name:         { type: DataTypes.STRING },
  phone:        { type: DataTypes.STRING },
  addressLine1: { type: DataTypes.STRING },
  addressLine2: { type: DataTypes.STRING },
  city:         { type: DataTypes.STRING },
  state:        { type: DataTypes.STRING },
  pincode:      { type: DataTypes.STRING },
  isDefault:    { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'addresses',
  timestamps: false
});

// Association: one user → many addresses
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, Address };