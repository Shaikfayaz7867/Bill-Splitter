const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Configured ✓' : 'Not configured ✗');
  
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bill-splitter';
    
    // Sanitize URI for logging
    const sanitizedURI = mongoURI.replace(
      /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      'mongodb$1://$2:****@'
    );
    console.log(`Attempting to connect to: ${sanitizedURI}`);

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    };
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    console.log('✅ Connection successful!');
    console.log(`Connected to database: ${mongoose.connection.name}`);
    
    // Check for collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Collections found: ${collections.length}`);
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed.');
    
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\nPossible reasons:');
      console.log('1. Wrong connection string');
      console.log('2. IP address not whitelisted in MongoDB Atlas');
      console.log('3. Database user credentials incorrect');
      console.log('4. Network connectivity issues');
    }
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 