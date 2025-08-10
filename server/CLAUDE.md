# ExpenseAI Backend Server

A Node.js backend API for ExpenseAI expense tracking application with AI-powered receipt processing.

## Tech Stack

### Core Framework

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework for building REST APIs
- **TypeScript**: Type-safe JavaScript development
- **ts-node**: TypeScript execution for development

### Database & Storage

- **Supabase**:

### AI & Machine Learning

- **OpenAI GPT-4 Vision**: Receipt text extraction and data parsing

### Authentication & Security

- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **cors**: Cross-origin resource sharing

### Validation & Documentation

- **zod**: Runtime type validation

### Development Tools

- **nodemon**: Development server with hot reload

## Project Structure

```
server/
├── src/
│   ├── controllers/          # Route handlers
│   │   ├── authController.ts
│   │   ├── expenseController.ts
│   │   ├── categoryController.ts
│   │   ├── aiController.ts
│   │   └── userController.ts
│   ├── middleware/           # Custom middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── routes/              # Route definitions
│   │   ├── auth.ts
│   │   ├── expenses.ts
│   │   ├── categories.ts
│   │   ├── ai.ts
│   │   └── users.ts
│   ├── services/            # Business logic
│   │   ├── aiService.ts
│   │   ├── expenseService.ts
│   │   ├── authService.ts
│   │   ├── imageService.ts
│   │   └── emailService.ts
│   ├── utils/               # Utility functions
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── config/              # Configuration files
│   │   ├── database.ts
│   │   └── env.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── express.ts
│   │   ├── api.ts
│   │   └── database.ts
│   └── app.ts               # Express app setup

├── docs/                    # Documentation
├── docker/                  # Docker configuration
├── scripts/                 # Build and deployment scripts
├── .env.example            # Environment variables template
├── .env                    # Environment variables (gitignored)
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Linting & Formatting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier

# Docker
npm run docker:build     # Build Docker image
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset confirmation

### Users

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `DELETE /api/v1/users/account` - Delete user account

### Expenses

- `GET /api/v1/expenses` - Get all expenses (paginated, filtered)
- `POST /api/v1/expenses` - Create new expense
- `GET /api/v1/expenses/:id` - Get expense by ID
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense
- `GET /api/v1/expenses/stats` - Get expense statistics
- `GET /api/v1/expenses/export` - Export expenses (CSV/PDF)

### Categories

- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create new category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### AI Processing

- `POST /api/v1/ai/process-receipt` - Process receipt image with AI
- `POST /api/v1/ai/extract-text` - Extract text from image
- `GET /api/v1/ai/processing-status/:jobId` - Check processing status

### Analytics

- `GET /api/v1/analytics/monthly` - Monthly spending analytics
- `GET /api/v1/analytics/categories` - Category breakdown
- `GET /api/v1/analytics/trends` - Spending trends
- `GET /api/v1/analytics/insights` - AI-generated insights

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/expenseai
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-vision-preview

# Google Cloud (Optional)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=expenseai-receipts

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

## Code Style & Conventions

### TypeScript

- Use strict type checking
- Prefer interfaces over types for object shapes
- Use enums for constants with multiple values
- Always define return types for functions

### Naming Conventions

- **Files**: camelCase (userController.ts)
- **Classes**: PascalCase (UserService)
- **Functions/Variables**: camelCase (getUserById)
- **Constants**: UPPER_SNAKE_CASE (MAX_FILE_SIZE)
- **Interfaces**: PascalCase with 'I' prefix (IUserData)
- **Types**: PascalCase with 'T' prefix (TApiResponse)

### Error Handling

- Use custom error classes that extend Error
- Always handle async/await with try-catch
- Return consistent error responses with proper HTTP status codes
- Log errors with appropriate log levels

### Database

- Use Supabase

### API Design

- Follow RESTful principles
- Use appropriate HTTP methods and status codes
- Implement proper request/response validation with Zod
- Version APIs (/api/v1/)
- Use pagination for list endpoints

### Security

- Validate all input data
- Sanitize user inputs
- Use parameterized queries (Prisma handles this)
- Implement proper authentication and authorization
- Rate limit API endpoints
- Use HTTPS in production

### Testing

- Write unit tests for services and utilities
- Write integration tests for API endpoints
- Use factory patterns for test data
- Mock external services (OpenAI, AWS, etc.)
- Aim for >80% code coverage

## Performance Considerations

### Caching Strategy

- Cache frequently accessed data in Redis
- Implement cache invalidation strategies
- Use CDN for static assets and images
- Cache AI processing results

### Database Optimization

- Index frequently queried columns
- Use database connection pooling
- Implement read replicas for analytics
- Optimize N+1 query problems

### Image Processing

- Compress uploaded images
- Generate thumbnails for receipts
- Use lazy loading for image galleries
- Implement progressive image loading

## AI Processing Workflow

1. **Image Upload**: Validate and temporarily store receipt image
2. **Preprocessing**: Resize, compress, and enhance image quality
3. **OCR Processing**: Extract text using OpenAI Vision API
4. **Data Extraction**: Parse extracted text to identify expense data
5. **Validation**: Validate extracted data and confidence scores
6. **Storage**: Store processed data and original image
7. **Response**: Return structured expense data to client

## Security Best Practices

- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF protection
- Rate limiting
- Secure file uploads
- Environment variable management
- Audit logging
- Regular security updates

## Deployment Strategy

### Development

- Local development with Docker Compose
- Hot reloading with nodemon
- Database seeding for testing

### Staging

- Docker containerization
- Environment-specific configurations
- Integration testing
- Performance testing

### Production

- Docker orchestration (Kubernetes/Docker Swarm)
- Load balancing
- SSL/TLS certificates
- Database backups
- Monitoring and alerting
- Graceful shutdowns
- Health checks

## Monitoring & Logging

### Logging Levels

- **ERROR**: Application errors, exceptions
- **WARN**: Warnings, deprecated features
- **INFO**: General application flow
- **DEBUG**: Detailed debugging information

### Metrics to Monitor

- API response times
- Database query performance
- AI processing times
- Error rates
- Memory usage
- CPU usage
- Disk space
- Request throughput

## Development Workflow

1. **Feature Development**
   - Create feature branch from main
   - Write tests first (TDD approach)
   - Implement feature with proper error handling
   - Update API documentation
   - Create migration scripts if needed

2. **Code Review Process**
   - Ensure tests pass
   - Check code coverage
   - Review security implications
   - Verify API documentation
   - Performance impact assessment

3. **Deployment Process**
   - Run full test suite
   - Build and test Docker images
   - Deploy to staging environment
   - Run integration tests
   - Deploy to production with rollback plan
