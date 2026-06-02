// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
   process.env.DATABASE_URL|| 
  `postgresql://neondb_owner:npg_uPArRsDpe82V@ep-fancy-math-apkjznbk.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require`,
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // Required for SSL on cloud providers (Supabase, Neon, Railway, etc.)
      // Comment out for local development
      ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
        ? { require: true, rejectUnauthorized: false }
        : false
    }
  }
);

module.exports = sequelize;