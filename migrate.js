// migrate.js
const { sequelize } = require('./models/index');

async function migrate() {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Connection established.');

    // Safely add enum value only if it doesn't already exist
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'pending_payment'
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_orders_orderStatus'
          )
        ) THEN
          ALTER TYPE "enum_orders_orderStatus" ADD VALUE 'pending_payment';
        END IF;
      END
      $$;
    `);
    console.log('✅ Enum updated.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();