require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const FarmSettings = require('../models/FarmSettings');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pfm');
    console.log('Connected to MongoDB for seeding');
    
    // Create default farm settings
    const settings = await FarmSettings.getSettings();
    console.log('✅ Default farm settings:', settings.farmName);
    
    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();