// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const { sequelize } = require('./models/index'); // ← replaces mongoose

const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/product');
const orderRoutes    = require('./routes/orders');
const paymentRoutes  = require('./routes/payment');
const uploadRoutes   = require('./routes/upload');
const categoryRoutes = require('./routes/categories');
const heroSlidesRoutes = require('./routes/heroSlides');
const wishlistRoutes   = require('./routes/wishlist'); 
const coupleMarqueeRoutes = require('./routes/Couplemarquee');
 

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://couplemart.in',
  'https://www.couplemart.in',
  'http://localhost:5173'

];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/payment',    paymentRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hero-slides', heroSlidesRoutes);
app.use('/api/wishlist',    wishlistRoutes);  
app.use('/api/couple-marquee', coupleMarqueeRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'CoupleMart API is running', db: 'PostgreSQL' })
);

 


// ── Connect to PostgreSQL and start server ────────────────────────────────────
sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL connected');
    return sequelize.sync({ alter: false }); // tables already created via migrate.js
  })
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 CoupleMart server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error('❌ PostgreSQL error:', err));

module.exports = app;