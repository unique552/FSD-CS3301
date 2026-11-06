
const mongoose = require('mongoose');

async function connectDatabase() {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_connect';

  try {
    await mongoose.connect(mongoUri);

    console.log('Connected to local MongoDB successfully!');
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

module.exports = connectDatabase;
