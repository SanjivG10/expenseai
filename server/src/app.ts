import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler, notFoundHandler, handleUncaughtExceptions } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import screenRoutes from './routes/screens';
import expenseRoutes from './routes/expenses';
import categoryRoutes from './routes/categories';
import userRoutes from './routes/users';
import env from './config/env';

// Handle uncaught exceptions
handleUncaughtExceptions();

const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com'] // Add your frontend domain
        : ['http://localhost:3000', 'http://localhost:19006', 'exp://localhost:19000'], // Development origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Endpoint logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Logging middleware
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ExpenseAI API is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: '1.0.0',
    },
  });
});

// API routes
app.use(`/api/${env.API_VERSION}/auth`, authRoutes);
app.use(`/api/${env.API_VERSION}/screens`, screenRoutes);
app.use(`/api/${env.API_VERSION}/expenses`, expenseRoutes);
app.use(`/api/${env.API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${env.API_VERSION}/users`, userRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 ExpenseAI API Server running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  if (env.NODE_ENV === 'development') {
    console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/${env.API_VERSION}/auth`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

export default app;
