// routes/product.js
const express = require('express');
const { Product, ProductVariant, Review } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// ─── GET ALL PRODUCTS (public) ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      category, subCategory, search, sort,
      featured, minPrice, maxPrice,
      page = 1, limit = 20
    } = req.query;

    const where = { isActive: true };

    if (category)    where.category    = category;
    if (subCategory) where.subCategory = subCategory;
    if (featured)    where.isFeatured  = true;
    if (search)      where.name        = { [Op.iLike]: `%${search}%` };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    const orderMap = {
      price_asc:  [['price', 'ASC']],
      price_desc: [['price', 'DESC']],
      rating:     [['rating', 'DESC']],
      discount:   [['discount', 'DESC']],
    };
    const order = orderMap[sort] || [['createdAt', 'DESC']];

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: ProductVariant, as: 'variants' }],
      order,
      limit: parseInt(limit),
      offset,
    });

    res.json({ products: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET SINGLE PRODUCT (public) ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductVariant, as: 'variants' },
        { model: Review, as: 'reviews' }
      ]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CREATE PRODUCT (admin only) ──────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { variants, ...productData } = req.body;

    const product = await Product.create(productData);

    if (variants?.length) {
      const variantRows = variants.map(v => ({ ...v, productId: product.id }));
      await ProductVariant.bulkCreate(variantRows);
    }

    const full = await Product.findByPk(product.id, {
      include: [{ model: ProductVariant, as: 'variants' }]
    });

    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE PRODUCT (admin only) ──────────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { variants, ...productData } = req.body;
    await product.update(productData);

    if (variants?.length) {
      await ProductVariant.destroy({ where: { productId: product.id } });
      const variantRows = variants.map(v => ({ ...v, productId: product.id }));
      await ProductVariant.bulkCreate(variantRows);
    }

    const full = await Product.findByPk(product.id, {
      include: [{ model: ProductVariant, as: 'variants' }]
    });
    res.json(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE PRODUCT (admin only) ──────────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADD REVIEW (logged in users) ─────────────────────────────────────────────
router.post('/:id/review', protect, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Review, as: 'reviews' }]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const already = product.reviews.find(r => r.userId === req.user.id);
    if (already) return res.status(400).json({ message: 'You already reviewed this product' });

    await Review.create({
      productId: product.id,
      userId: req.user.id,
      name: req.user.name,
      rating: req.body.rating,
      comment: req.body.comment
    });

    // Recalculate average rating
    const reviews = await Review.findAll({ where: { productId: product.id } });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await product.update({ rating: avg.toFixed(2), numReviews: reviews.length });

    res.status(201).json({ message: 'Review added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;