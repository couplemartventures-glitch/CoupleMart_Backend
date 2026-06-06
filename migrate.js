// migrate.js — updated to also create couple_marquee_images table
const { sequelize } = require('./models/index');

async function migrate() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Connection established.');
    // ── couple_marquee_images table ───────────────────────────────────────────
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS couple_marquee_images (
        id          SERIAL      PRIMARY KEY,
        url         TEXT        NOT NULL,
        "order"     INTEGER     NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ couple_marquee_images table ready.');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_couple_marquee_order
      ON couple_marquee_images("order");
    `);
    console.log('✅ couple_marquee_images index ready.');

    console.log('🎉 All migrations complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();