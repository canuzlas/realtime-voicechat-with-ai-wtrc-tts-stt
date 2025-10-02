#!/bin/bash

# AI Voice Chat Assistant - Quick Start Script
# This script helps you quickly set up and run the project

set -e

echo "🎙️  AI Voice Chat Assistant - Quick Start"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd server

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found in server directory${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ Created server/.env${NC}"
    echo -e "${YELLOW}⚠️  Please edit server/.env and add your API keys:${NC}"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET"
    echo "   - OPENAI_API_KEY"
    echo ""
fi

if [ ! -d node_modules ]; then
    echo "📦 Installing backend dependencies..."
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

cd ..

# Frontend setup
echo ""
echo "🔧 Setting up frontend..."

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found in root directory${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env${NC}"
fi

if [ ! -d node_modules ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Make sure MongoDB is running:"
echo "   docker run -d -p 27017:27017 --name mongodb mongo:6.0"
echo ""
echo "2. Start the backend (in a new terminal):"
echo "   cd server && npm start"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to configure your API keys in server/.env!${NC}"
echo ""
echo "🚀 Happy coding!"
