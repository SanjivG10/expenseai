#!/bin/bash

# ExpenseAI Server Deployment Script
# This script can be run locally or via GitHub Actions

set -e

echo "🚀 Starting ExpenseAI Server deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the server directory."
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
yarn install --frozen-lockfile

# Build the application
print_status "Building application..."
yarn build

# Check if dist directory was created
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

# Run tests (optional, can be skipped with --skip-tests flag)
if [ "$1" != "--skip-tests" ]; then
    print_status "Running tests..."
    yarn test
else
    print_warning "Skipping tests..."
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Make sure environment variables are configured."
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_status "PM2 not found. Installing PM2 globally..."
    npm install -g pm2
fi

# Stop existing PM2 processes (ignore errors if not running)
print_status "Stopping existing PM2 processes..."
pm2 stop expenseai || true

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Show PM2 status
print_status "Deployment completed! PM2 status:"
pm2 status

# Show logs location
print_status "Application logs are available at:"
echo "  - Combined: $(pwd)/logs/combined.log"
echo "  - Output:   $(pwd)/logs/out.log" 
echo "  - Error:    $(pwd)/logs/error.log"

print_status "✅ Deployment completed successfully!"
print_status "🏥 Health check: http://localhost:3000/health"