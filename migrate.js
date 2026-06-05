// migrate.js — updated to also create wishlists table
const { sequelize } = require('./models/index');

async function migrate() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Connection established.');

     

    // ── NEW: create wishlists table ───────────────────────────────────────────
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
        "productId" UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("userId", "productId")
      );
    `);
    console.log('✅ wishlists table ready.');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_wishlists_userId
      ON wishlists("userId");
    `);
    console.log('✅ wishlists index ready.');

    console.log('🎉 All migrations complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();