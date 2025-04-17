const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bill-splitter';
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s
      family: 4 // Use IPv4, skip IPv6
    };
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('MongoDB connected ✅');
      console.log(`Connected to database: ${mongoose.connection.name}`);
    }

    return true;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
