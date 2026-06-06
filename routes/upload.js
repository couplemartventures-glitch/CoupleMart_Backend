const express    = require('express');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

cloudinary.config({
  cloud_name:'dit4vpby1',
  api_key:'175884332669247',
  api_secret:'wQz6UPDzjmH-MGSAwb5wVxuGysM',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'couplemart',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 800, height: 1000, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/upload
router.post('/', protect, adminOnly, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'No files uploaded' });

    const urls = req.files.map(f => f.path);
    res.json({ urls, message: `${urls.length} image(s) uploaded` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/upload
router.delete('/', protect, adminOnly, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });

    const parts    = url.split('/');
    const file     = parts[parts.length - 1];
    const name     = file.substring(0, file.lastIndexOf('.'));
    const publicId = `couplemart/${name}`;

    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;