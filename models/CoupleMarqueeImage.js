// models/CoupleMarqueeImage.js
// Add this file and register it in your models/index.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CoupleMarqueeImage = sequelize.define('CoupleMarqueeImage', {
    url:   { type: DataTypes.TEXT,    allowNull: false },
    order: { type: DataTypes.INTEGER, defaultValue: 0  },
  }, {
    tableName: 'couple_marquee_images',
  });

  return CoupleMarqueeImage;
};

// ─── In your models/index.js, add: ────────────────────────────────────────────
//
// const CoupleMarqueeImage = require('./CoupleMarqueeImage')(sequelize);
// module.exports = { ..., CoupleMarqueeImage };
//
// ─── In your app.js / server.js, register the route: ─────────────────────────
//
// const coupleMarqueeRoutes = require('./routes/coupleMarquee');
// app.use('/api/couple-marquee', coupleMarqueeRoutes);
//
// Sequelize will auto-create the table on next sync if you have
// sequelize.sync({ alter: true }) or force: false in your setup.