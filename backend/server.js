const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Debug information
console.log('Starting server with debugging enabled...');
console.log('Node environment:', process.env.NODE_ENV || 'development');
console.log('Server port:', PORT);

// CORS configuration - Simplified for reliability
let corsOptions;
if (process.env.NODE_ENV === 'production') {
  // In production, allow requests from all origins
  corsOptions = {
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
  console.log('CORS: Production mode - allowing all origins');
} else {
  // In development, only allow specific origins
  corsOptions = {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
  console.log('CORS: Development mode - restricted origins');
}

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle pre-flight OPTIONS requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

// Root route handler (important for deployment health checks)
app.get('/', (req, res) => {
  res.json({
    message: 'Bill Splitter API is running',
    version: '1.0.0',
    endpoints: [
      '/api/groups',
      '/api/expenses',
      '/api/settlements',
      '/api/test',
      '/api/system/status',
      '/api/debug/routes'
    ],
    status: 'ok'
  });
});

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Email test route
app.get('/api/test/email', async (req, res) => {
  try {
    const { testEmail } = require('./utils/emailService');
    const result = await testEmail();
    res.json({
      ...result,
      serverInfo: {
        nodeEnv: process.env.NODE_ENV || 'development',
        mongodbUri: process.env.MONGODB_URI ? 'configured' : 'missing',
        emailConfigured: process.env.EMAIL_USER && process.env.EMAIL_PASS ? true : false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// System status route
app.get('/api/system/status', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      database: mongoose.connection.name || null
    };

    // Check email configuration
    const emailStatus = {
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      provider: process.env.EMAIL_HOST ? 'custom-smtp' : 'gmail',
      fromName: process.env.EMAIL_FROM_NAME || 'Bill Splitter'
    };

    // Return comprehensive system status
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      server: {
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      database: dbStatus,
      email: emailStatus,
      env: {
        port: process.env.PORT || '5000',
        mongodbConfigured: !!process.env.MONGODB_URI,
        emailUser: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : undefined,
        hasEmailPassword: !!process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DEBUG route to list all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const path = handler.route.path;
          const baseRoute = middleware.regexp.toString()
            .replace('\\^', '')
            .replace('\\/?(?=\\/|$)', '')
            .replace(/\\\//g, '/');
          
          const fullPath = baseRoute.replace(/\\/g, '') + path;
          
          routes.push({
            path: fullPath,
            methods: Object.keys(handler.route.methods),
            stack: handler.route.stack.length
          });
        }
      });
    }
  });
  
  res.json({ routes });
});

// Print registered routes in console for debugging
console.log('Registering routes...');

// Import routes
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');

// Mount API routes
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

app.use((err, req, res, next) => {
  // Special handling for CORS errors
  if (err.message.includes('CORS')) {
    console.error('CORS Error:', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      headers: req.headers,
      error: err.message
    });
    
    return res.status(403).json({
      success: false,
      message: 'CORS error - Origin not allowed',
      origin: req.headers.origin,
      allowedOrigins: process.env.NODE_ENV === 'production' ? 'All origins in production' : 'See server logs'
    });
  }

  // General error handling
  console.error('Global error handler:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} - Environment: ${process.env.NODE_ENV}`);
  console.log(`Access the API at http://localhost:${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`Production mode enabled - CORS is configured to accept all origins`);
  } else {
    console.log(`Development mode - CORS is restricted to allowed origins`);
  }
});
