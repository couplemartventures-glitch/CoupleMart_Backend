// routes/coupleMarquee.js
const express    = require('express');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect, adminOnly } = require('../middleware/auth');

// ── Sequelize model (create this in models/ — see comment below) ──────────────
// CREATE TABLE couple_marquee_images (
//   id         SERIAL PRIMARY KEY,
//   url        TEXT NOT NULL,
//   "order"    INTEGER NOT NULL DEFAULT 0,
//   "createdAt" TIMESTAMPTZ DEFAULT NOW(),
//   "updatedAt" TIMESTAMPTZ DEFAULT NOW()
// );
//
// In your models/index.js, add:
// const CoupleMarqueeImage = sequelize.define('CoupleMarqueeImage', {
//   url:   { type: DataTypes.TEXT, allowNull: false },
//   order: { type: DataTypes.INTEGER, defaultValue: 0 },
// }, { tableName: 'couple_marquee_images' });
// module.exports = { ..., CoupleMarqueeImage };

const { CoupleMarqueeImage } = require('../models/index');

const router = express.Router();

// ── Cloudinary config (reuses same credentials as upload.js) ─────────────────
cloudinary.config({
  cloud_name: 'dit4vpby1',
  api_key:    '175884332669247',
  api_secret: 'wQz6UPDzjmH-MGSAwb5wVxuGysM',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'couplemart/marquee',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 600, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── GET all marquee images (public) ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const images = await CoupleMarqueeImage.findAll({ order: [['order', 'ASC'], ['createdAt', 'ASC']] });
    res.json({ images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST upload new image (admin) ───────────────────────────────────────────
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const count  = await CoupleMarqueeImage.count();
    const image  = await CoupleMarqueeImage.create({ url: req.file.path, order: count });
    res.status(201).json({ image });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE image (admin) ─────────────────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const image = await CoupleMarqueeImage.findByPk(req.params.id);
    if (!image) return res.status(404).json({ message: 'Not found' });

    // Remove from Cloudinary
    const parts    = image.url.split('/');
    const file     = parts[parts.length - 1];
    const name     = file.substring(0, file.lastIndexOf('.'));
    const publicId = `couplemart/marquee/${name}`;
    await cloudinary.uploader.destroy(publicId).catch(() => {}); // non-fatal

    await image.destroy();
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT reorder (admin) ──────────────────────────────────────────────────────
router.put('/reorder', protect, adminOnly, async (req, res) => {
  try {
    const { ids } = req.body; // array of ids in desired order
    if (!Array.isArray(ids)) return res.status(400).json({ message: 'ids array required' });
    await Promise.all(ids.map((id, idx) => CoupleMarqueeImage.update({ order: idx }, { where: { id } })));
    res.json({ message: 'Reordered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;