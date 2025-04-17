const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bill-splitter';

    // Log connection attempt but mask credentials
    const sanitizedURI = mongoURI.replace(
      /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      'mongodb$1://$2:****@'
    );
    console.log(`Attempting to connect to MongoDB: ${sanitizedURI}`);
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      serverSelectionTimeoutMS: 10000, // Increased timeout for cloud deployments
      socketTimeoutMS: 45000, // Close sockets after 45s
      family: 4 // Use IPv4, skip IPv6
    };
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    // Log successful connection
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      console.log('MongoDB connected ✅');
      console.log(`Connected to database: ${mongoose.connection.name}`);
    }

    return true;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.error('Please check your MONGODB_URI environment variable and ensure network connectivity');
    
    // Don't exit process in production to allow retries
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    return false;
  }
};

module.exports = connectDB;
