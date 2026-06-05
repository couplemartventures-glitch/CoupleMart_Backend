// routes/wishlist.js
const express = require('express');
const router  = express.Router();
const { Wishlist }                  = require('../models/index');
const { Product, ProductVariant }   = require('../models/index');
const { protect }                   = require('../middleware/auth');

// ── GET /api/wishlist ─────────────────────────────────────────────────────────
// Returns all wishlisted products for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        as: 'product',
        include: [{ model: ProductVariant, as: 'variants' }]
      }],
      order: [['createdAt', 'DESC']]
    });

    const products = items
      .filter(item => item.product)          // skip deleted products
      .map(item => ({
        ...item.product.toJSON(),
        wishlistId: item.id                  // handy if you need to reference the row
      }));

    res.json({ wishlist: products, count: products.length });
  } catch (err) {
    console.error('GET /wishlist error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/wishlist/:productId ─────────────────────────────────────────────
// Toggle: adds if not present, removes if already saved
router.post('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId        = req.user.id;

    const existing = await Wishlist.findOne({ where: { userId, productId } });

    if (existing) {
      await existing.destroy();
      return res.json({ added: false, message: 'Removed from wishlist' });
    }

    await Wishlist.create({ userId, productId });
    res.status(201).json({ added: true, message: 'Added to wishlist' });
  } catch (err) {
    console.error('POST /wishlist/:id error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/wishlist/check/:productId ────────────────────────────────────────
// Quick check — is this product in the user's wishlist?
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      where: { userId: req.user.id, productId: req.params.productId }
    });
    res.json({ wishlisted: !!item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;