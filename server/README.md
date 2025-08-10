# ExpenseAI Backend Server

A Node.js + Express + TypeScript backend API for ExpenseAI with Supabase authentication.

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Configure Supabase:**
- Create a Supabase project at https://supabase.com
- Get your project URL and anon key from Settings > API
- Update SUPABASE_URL and SUPABASE_ANON_KEY in .env
- Get service role key (keep it secret!) and update SUPABASE_SERVICE_ROLE_KEY

4. **Generate JWT secrets:**
```bash
# Generate secure random strings (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Update JWT_SECRET and JWT_REFRESH_SECRET in .env

5. **Start development server:**
```bash
npm run dev
```

Server will start on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create account
- `POST /api/v1/auth/login` - Sign in
- `POST /api/v1/auth/logout` - Sign out
- `POST /api/v1/auth/forgot-password` - Send password reset email
- `POST /api/v1/auth/verify-otp` - Verify OTP code
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile

### Health Check
- `GET /health` - Server health check
- `GET /api/v1/auth/health` - Auth service health check

## Development Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Environment Variables

See `.env.example` for all required environment variables.

### Required Variables
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - JWT signing secret (32+ characters)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (32+ characters)

### Optional Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `OPENAI_API_KEY` - For future AI features
- `LOG_LEVEL` - Logging level (info/debug/warn/error)

## Authentication Flow

1. **Signup**: Creates user in Supabase Auth, returns JWT tokens
2. **Login**: Authenticates with Supabase, returns JWT tokens
3. **Forgot Password**: Sends OTP via Supabase Auth email
4. **Verify OTP**: Validates OTP for password reset
5. **Reset Password**: Updates password in Supabase
6. **Refresh Token**: Generates new access token
7. **Logout**: Invalidates tokens

## Security Features

- Rate limiting on auth endpoints
- JWT token-based authentication
- Password strength validation
- Secure headers with Helmet
- CORS configuration
- Request/response validation with Zod
- Error handling without sensitive data exposure

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── routes/          # Route definitions  
├── services/        # Business logic
├── utils/           # Utilities and helpers
└── app.ts          # Express app setup
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Set production environment variables

3. Start production server:
```bash
npm start
```

## Troubleshooting

### Common Issues

1. **"Invalid Supabase credentials"**
   - Check SUPABASE_URL and keys in .env
   - Ensure service role key has proper permissions

2. **"JWT secret too short"**
   - Generate 32+ character secrets
   - Use crypto.randomBytes(32).toString('hex')

3. **"Rate limit exceeded"**
   - Wait for rate limit window to reset
   - Adjust RATE_LIMIT_MAX in .env if needed

4. **CORS errors**
   - Update allowed origins in app.ts
   - Check frontend URL matches CORS config