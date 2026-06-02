// create-admin.js  — run this ONCE to make yourself an admin
// Usage: node create-admin.js
// Place this file in your backend root folder

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User } = require('./models/index');
const { sequelize } = require('./models/index');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Change these to your desired admin credentials
    const ADMIN_NAME     = 'Admin';
    const ADMIN_EMAIL    = 'admin@couplemart.in';   // ← change this
    const ADMIN_PASSWORD = 'Admin@123';              // ← change this

    const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });

    if (existing) {
      // If user exists, just upgrade to admin
      await existing.update({ role: 'admin' });
      console.log(`✅ User ${ADMIN_EMAIL} upgraded to admin`);
    } else {
      // Create new admin user
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,  // auto-hashed by beforeCreate hook
        role: 'admin'
      });
      console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
    }

    console.log('\n🔐 Login credentials:');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n📌 Go to: http://localhost:5173/login');
    console.log('   Then navigate to: http://localhost:5173/admin');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();