// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Address } = require('../models/index');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Mongoose: User.findOne({ email })
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // Mongoose: User.create(...)  ← same API in Sequelize
    const user = await User.create({ name, email, phone, password });

    res.status(201).json({
      id: user.id,           // Sequelize uses .id (UUID), not ._id
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Get Profile ──────────────────────────────────────────────────────────────
router.get('/profile', protect, async (req, res) => {
  try {
    // Mongoose: User.findById(id).select('-password')
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },       // equivalent to .select('-password')
      include: [{ model: Address, as: 'addresses' }]
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    // Mongoose: User.findById(id) then mutate + .save()
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, password } = req.body;

    // Only set fields that were actually sent
    if (name)     user.name     = name;
    if (phone)    user.phone    = phone;
    if (password) user.password = password; // beforeUpdate hook re-hashes automatically

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user.id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Add Address ──────────────────────────────────────────────────────────────
router.post('/address', protect, async (req, res) => {
  try {
    // If new address is default, clear existing default first
    if (req.body.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    // Mongoose: user.addresses.push(req.body); await user.save();
    await Address.create({ ...req.body, userId: req.user.id });

    // Return updated list
    const addresses = await Address.findAll({ where: { userId: req.user.id } });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Delete Address ───────────────────────────────────────────────────────────
router.delete('/address/:id', protect, async (req, res) => {
  try {
    // Mongoose: user.addresses.filter(...); await user.save()
    const deleted = await Address.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id  // ensures users can only delete their own addresses
      }
    });

    if (!deleted) return res.status(404).json({ message: 'Address not found' });

    const addresses = await Address.findAll({ where: { userId: req.user.id } });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Toggle Wishlist ──────────────────────────────────────────────────────────
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const pid = req.params.productId;

    // wishlist is a PostgreSQL UUID[] array column
    const wishlist = user.wishlist || [];
    const idx = wishlist.indexOf(pid);

    if (idx > -1) {
      wishlist.splice(idx, 1);  // remove
    } else {
      wishlist.push(pid);       // add
    }

    // Must reassign the array field to trigger Sequelize change detection
    user.wishlist = [...wishlist];
    await user.save();

    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;