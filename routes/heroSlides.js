// routes/heroSlides.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const SLIDES_FILE = path.join(__dirname, '..', 'data', 'heroSlides.json');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(SLIDES_FILE)) fs.writeFileSync(SLIDES_FILE, JSON.stringify([]));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, 'hero-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Only jpeg/jpg/png/webp allowed'));
  }
});

// GET /api/hero-slides  — public
router.get('/', (req, res) => {
  const slides = JSON.parse(fs.readFileSync(SLIDES_FILE));
  res.json({ slides });
});

// POST /api/hero-slides  — upload new slide (admin only)
router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  try {
    const slides = JSON.parse(fs.readFileSync(SLIDES_FILE));
    const slide = {
      id: Date.now().toString(),
      url: `/uploads/${req.file.filename}`,
      title: req.body.title || '',
      subtitle: req.body.subtitle || '',
      link: req.body.link || '',
      order: slides.length,
    };
    slides.push(slide);
    fs.writeFileSync(SLIDES_FILE, JSON.stringify(slides, null, 2));
    res.json({ slide });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/hero-slides/:id  — update order/text
router.patch('/:id', protect, adminOnly, (req, res) => {
  const slides = JSON.parse(fs.readFileSync(SLIDES_FILE));
  const idx = slides.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Slide not found' });
  slides[idx] = { ...slides[idx], ...req.body };
  fs.writeFileSync(SLIDES_FILE, JSON.stringify(slides, null, 2));
  res.json({ slide: slides[idx] });
});

// DELETE /api/hero-slides/:id
router.delete('/:id', protect, adminOnly, (req, res) => {
  let slides = JSON.parse(fs.readFileSync(SLIDES_FILE));
  const slide = slides.find(s => s.id === req.params.id);
  if (!slide) return res.status(404).json({ message: 'Slide not found' });
  // Delete the actual file
  const filePath = path.join(__dirname, '..', slide.url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  slides = slides.filter(s => s.id !== req.params.id).map((s, i) => ({ ...s, order: i }));
  fs.writeFileSync(SLIDES_FILE, JSON.stringify(slides, null, 2));
  res.json({ message: 'Slide deleted' });
});

// PUT /api/hero-slides/reorder  — save new order
router.put('/reorder', protect, adminOnly, (req, res) => {
  const { ids } = req.body; // array of ids in new order
  const slides = JSON.parse(fs.readFileSync(SLIDES_FILE));
  const reordered = ids.map((id, i) => {
    const s = slides.find(s => s.id === id);
    return { ...s, order: i };
  });
  fs.writeFileSync(SLIDES_FILE, JSON.stringify(reordered, null, 2));
  res.json({ slides: reordered });
});

module.exports = router;