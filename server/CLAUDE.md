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


# 🔄 REVISED: Screen-Centric API Design (One Call Per Screen)

**You're absolutely right!** Let's redesign with **one endpoint per screen** for better performance:

---

## 🏠 Dashboard Screen Endpoint

- `GET /api/v1/screens/dashboard` - Get all dashboard data in one call
  ```json
  Response: {
    "monthlyStats": {
      "total": 823.45,
      "expenseCount": 32,
      "avgDaily": 27.45,
      "categoriesCount": 8
    },
    "recentExpenses": [
      {
        "id": "1", 
        "amount": 45.67,
        "description": "Coffee",
        "category": "food",
        "categoryName": "Food & Drink",
        "categoryIcon": "restaurant-outline",
        "date": "2025-01-10"
      }
      // ... last 3-5 expenses
    ],
    "calendarData": {
      "2025-01-10": [expense1, expense2],
      "2025-01-15": [expense3]
      // Current month calendar data
    }
  }
  ```

---

## 📝 Expenses Screen Endpoint  

- `GET /api/v1/screens/expenses` - Get all expenses screen data
  ```
  Query params:
  - page, limit (pagination)
  - search (description search)  
  - category (filter by category)
  - startDate, endDate (date range)
  - sortBy (date|amount|category)
  - sortOrder (asc|desc)
  ```
  ```json
  Response: {
    "expenses": [
      {
        "id": "1",
        "amount": 45.67,
        "description": "Coffee at Starbucks",
        "category": "food", 
        "categoryName": "Food & Drink",
        "categoryIcon": "restaurant-outline",
        "date": "2025-01-10",
        "notes": "Meeting with client",
        "receiptImage": "url_to_image"
      }
      // ... paginated expenses
    ],
    "categories": [
      {
        "id": "food",
        "name": "Food & Drink", 
        "icon": "restaurant-outline",
        "color": "#FF6B6B"
      }
      // ... all categories for filter dropdown
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 127,
      "hasMore": true
    },
    "summary": {
      "totalExpenses": 127,
      "filteredTotal": 823.45
    }
  }
  ```

---

## 📊 Analytics Screen Endpoint

- `GET /api/v1/screens/analytics?period=month` - Get all analytics data
  ```json
  Response: {
    "period": "month",
    "summary": {
      "thisMonth": { "total": 823.45, "change": "+12%" },
      "avgDaily": { "amount": 27.45, "change": "+5%" },
      "totalCategories": 8,
      "totalTransactions": 32,
      "topCategory": "Food & Drink"
    },
    "spendingTrends": {
      "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
      "data": [120, 180, 95, 230]
    },
    "categoryBreakdown": [
      { 
        "name": "Food", 
        "amount": 234, 
        "percentage": 28.4,
        "color": "#FFFFFF" 
      },
      // ... pie chart data
    ],
    "monthlyComparison": {
      "labels": ["Dec", "Jan", "Feb", "Mar", "Apr"],
      "data": [450, 380, 520, 310, 480]
    }
  }
  ```

---

## ⚙️ Settings Screen Endpoint

- `GET /api/v1/screens/settings` - Get all settings data
  ```json
  Response: {
    "userProfile": {
      "id": "123",
      "firstName": "John",
      "lastName": "Doe", 
      "email": "john@example.com",
      "memberSince": "2025-01-01"
    },
    "categories": [
      {
        "id": "food",
        "name": "Food & Drink",
        "icon": "restaurant-outline", 
        "color": "#FF6B6B",
        "isDefault": false,
        "expenseCount": 45
      }
      // ... all user categories
    ],
    "preferences": {
      "currency": "USD",
      "notifications": true,
      "defaultCategory": "other"
    }
  }
  ```

---

## 📷 Camera Screen Endpoint (after receipt scan)

- `POST /api/v1/screens/camera/process-receipt` - Process receipt and return form data
  ```json
  Body: {
    "image": "base64_encoded_image"
  }
  Response: {
    "extractedData": {
      "amount": 23.45,
      "merchantName": "Starbucks", 
      "date": "2025-01-10",
      "suggestedCategory": "food",
      "items": ["Latte", "Croissant"],
      "confidence": 0.95
    },
    "categories": [
      // All categories for dropdown
    ],
    "formDefaults": {
      "date": "2025-01-10",
      "currency": "USD"
    }
  }
  ```

---

## 🔧 Individual CRUD Operations (for updates after initial screen load)

- `POST /api/v1/expenses` - Create new expense
- `PUT /api/v1/expenses/:id` - Update expense  
- `DELETE /api/v1/expenses/:id` - Delete expense
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category
- `PUT /api/v1/users/profile` - Update profile

---

# 🎯 Benefits of Screen-Centric Design:

### ✅ **Performance**
- **Single network call per screen** = faster loading
- **Reduced latency** = better user experience  
- **Fewer loading states** = cleaner UI

### ✅ **Mobile Optimization**
- **Less battery drain** from fewer network requests
- **Better offline support** = cache complete screen data
- **Improved perceived performance**

### ✅ **Development Benefits**  
- **Simpler frontend logic** = one API call per screen
- **Easier state management** = atomic data loading
- **Better error handling** = single failure point per screen

### ✅ **Backend Efficiency**
- **Database query optimization** = join related data in single query
- **Reduced server load** = fewer HTTP connections
- **Better caching** = cache complete screen responses

---

**This revised approach gives us the best of both worlds:**
- **Screen endpoints** for initial loads (fast, efficient)  
- **Individual CRUD** for updates (flexible, targeted)

---

# 📋 Final API Endpoint Summary (Implementation Ready)

## 🔐 Authentication Endpoints ✅ (Already Implemented)
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login` 
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/profile`
- `PUT /api/v1/auth/profile`

## 📱 Screen-Centric Endpoints (To Implement)
- `GET /api/v1/screens/dashboard` - Complete dashboard data
- `GET /api/v1/screens/expenses` - Expenses list with filters & categories  
- `GET /api/v1/screens/analytics` - All analytics & chart data
- `GET /api/v1/screens/settings` - User profile, categories, preferences
- `POST /api/v1/screens/camera/process-receipt` - AI receipt processing

## 🔧 Individual CRUD Operations (To Implement)
- `POST /api/v1/expenses` - Create expense
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense  
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category
- `PUT /api/v1/users/profile` - Update user profile

## 🎯 Priority Implementation Order
1. **Phase 1**: Database setup + Basic screen endpoints (dashboard, expenses, settings)
2. **Phase 2**: Analytics endpoint + CRUD operations
3. **Phase 3**: AI receipt processing + Camera endpoint

**Total: 5 screen endpoints + 7 CRUD endpoints = 12 endpoints to implement**

---

## Environment Variables

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
