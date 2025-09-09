require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;
// Determine public base URL for logs and swagger
const BASE_URL = process.env.NODE_ENV === 'production'
  ? (
      process.env.PUBLIC_URL ||
      process.env.BASE_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'https://xride-backend.onrender.com'
    )
  : `http://localhost:${PORT}`;

// Basic rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API with Firebase & MySQL',
      version: '1.0.0',
      description: 'A secure, scalable Express backend with Firebase Auth and MySQL',
    },
    servers: [
      {
        url: BASE_URL,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Firebase JWT token',
        },
      },
      schemas: {
        Order: {
          type: 'object',
          properties: {
            orderId: {
              type: 'integer',
              description: 'Auto-generated order ID',
              example: 123,
            },
            userUid: {
              type: 'string',
              description: 'Firebase user UID',
              example: 'firebase-uid-123',
            },
            pickupAddress: {
              type: 'string',
              description: 'Pickup address',
              example: '123 Main St, New York, NY 10001',
            },
            dropoffAddress: {
              type: 'string',
              description: 'Dropoff address',
              example: '456 Oak Ave, Brooklyn, NY 11201',
            },
            latPickup: {
              type: 'number',
              format: 'float',
              description: 'Pickup latitude',
              example: 40.7128,
            },
            lngPickup: {
              type: 'number',
              format: 'float',
              description: 'Pickup longitude',
              example: -74.0060,
            },
            latDropoff: {
              type: 'number',
              format: 'float',
              description: 'Dropoff latitude',
              example: 40.6782,
            },
            lngDropoff: {
              type: 'number',
              format: 'float',
              description: 'Dropoff longitude',
              example: -73.9442,
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Order amount',
              example: 29.99,
            },
            orderType: {
              type: 'string',
              description: 'Type of order',
              example: 'delivery',
            },
            status: {
              type: 'string',
              description: 'Order status',
              example: 'pending',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
              example: '2023-12-01T10:30:00.000Z',
            },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['pickupAddress', 'dropoffAddress', 'latPickup', 'lngPickup', 'latDropoff', 'lngDropoff', 'amount', 'orderType'],
          properties: {
            pickupAddress: {
              type: 'string',
              description: 'Pickup address',
              example: '123 Main St, New York, NY 10001',
            },
            dropoffAddress: {
              type: 'string',
              description: 'Dropoff address',
              example: '456 Oak Ave, Brooklyn, NY 11201',
            },
            latPickup: {
              type: 'number',
              format: 'float',
              description: 'Pickup latitude',
              example: 40.7128,
            },
            lngPickup: {
              type: 'number',
              format: 'float',
              description: 'Pickup longitude',
              example: -74.0060,
            },
            latDropoff: {
              type: 'number',
              format: 'float',
              description: 'Dropoff latitude',
              example: 40.6782,
            },
            lngDropoff: {
              type: 'number',
              format: 'float',
              description: 'Dropoff longitude',
              example: -73.9442,
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Order amount',
              example: 29.99,
            },
            orderType: {
              type: 'string',
              description: 'Type of order',
              example: 'delivery',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed',
            },
            details: {
              type: 'string',
              description: 'Detailed error information',
              example: 'pickupAddress is required',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Express API Documentation"
}));

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   example: 2023-12-01T10:30:00.000Z
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error caught by global handler:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || err.statusCode || 500,
  };

  // MySQL/Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    error = {
      message: 'Duplicate entry. Resource already exists.',
      status: 409,
    };
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    error = {
      message: 'Database table not found.',
      status: 500,
    };
  }

  if (err.code === 'ECONNREFUSED') {
    error = {
      message: 'Database connection failed.',
      status: 500,
    };
  }

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    error = {
      message: 'Authentication error.',
      status: 401,
    };
  }

  // Syntax errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = {
      message: 'Invalid JSON format in request body.',
      status: 400,
    };
  }

  // Don't expose sensitive error details in production
  const response = {
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err,
    }),
  };

  res.status(error.status).json(response);
};

// Initialize services first
async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');
    
    // Initialize Firebase
    const { initializeFirebase } = require('./config/firebase');
    await initializeFirebase();
    console.log('✅ Firebase Admin SDK initialized');
    
    // Initialize database
    const db = require('./config/db');

    try {
      await db.initializeDatabase();
      // perform a lightweight connectivity check
      try {
        const conn = await db.getConnection();
        await conn.execute('SELECT 1');
        conn.release();
        console.log('✅ MySQL database connected and reachable');
      } catch (dbTestErr) {
        console.error('❌ MySQL connected but test query failed:', dbTestErr.message || dbTestErr);
        return false;
      }
    } catch (dbInitErr) {
      console.error('❌ MySQL database initialization failed:', dbInitErr.message || dbInitErr);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
    return false;
  }
}

// API routes (loaded after services are initialized)
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    user: 'Not authenticated'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Initialize services first
    const servicesReady = await initializeServices();
    
    if (servicesReady) {
      // Load routes after services are ready
      const orderRoutes = require('./routes/orders');
      app.use('/api/orders', orderRoutes);
      console.log('✅ Routes loaded');
    }
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 XRide Backend Server running on port ${PORT}`);
      try {
        const docsUrl = new URL('/api-docs', BASE_URL).toString();
        const healthUrl = new URL('/health', BASE_URL).toString();
        const testUrl = new URL('/api/test', BASE_URL).toString();

        console.log(`📚 API Documentation: ${docsUrl}`);
        console.log(`🏥 Health Check: ${healthUrl}`);
        console.log(`🧪 Test Endpoint: ${testUrl}`);
      } catch (e) {
        // Fallbacks if BASE_URL is not a full URL
        console.log(`📚 API Documentation: ${BASE_URL.replace(/\/$/, '')}/api-docs`);
        console.log(`🏥 Health Check: ${BASE_URL.replace(/\/$/, '')}/health`);
        console.log(`🧪 Test Endpoint: ${BASE_URL.replace(/\/$/, '')}/api/test`);
      }

      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚡ XRide Backend v1.0.0 - Ready for requests!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();