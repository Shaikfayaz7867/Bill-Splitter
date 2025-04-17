const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const testMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    return true;
  } catch (error) {
    return false;
  }
};

// Run the test if this file is run directly
if (require.main === module) {
  testMongoDB().then(success => {
    if (!success) {
      process.exit(1);
    }
    process.exit(0);
  });
}

module.exports = testMongoDB; 