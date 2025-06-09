#!/bin/bash

# YouTube Bot - Linux/macOS Setup Script
echo "🤖 YouTube Bot - Unix Setup"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_status "❌ Node.js not found" $RED
    print_status "📥 Install Node.js v18+ from: https://nodejs.org/" $YELLOW
    
    # Detect OS and provide specific instructions
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            print_status "   Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -" $YELLOW
            print_status "                  sudo apt-get install -y nodejs" $YELLOW
        elif command -v yum &> /dev/null; then
            print_status "   CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -" $YELLOW
            print_status "                sudo yum install -y nodejs" $YELLOW
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "   macOS: brew install node" $YELLOW
    fi
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_status "❌ Node.js v$NODE_VERSION detected (requires v18+)" $RED
    exit 1
fi

print_status "✅ Node.js $(node --version) detected" $GREEN

# Check if Git is installed
if ! command -v git &> /dev/null; then
    print_status "❌ Git not found" $RED
    print_status "📥 Install Git from: https://git-scm.com/" $YELLOW
    exit 1
fi

print_status "✅ $(git --version) detected" $GREEN

print_status "⚙️  Setting up environment..." $BLUE

# Create directories
mkdir -p data logs
print_status "✅ Directories created" $GREEN

# Setup environment file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "✅ Environment file created" $GREEN
        print_status "📝 Please edit .env file with your configuration" $YELLOW
    else
        print_status "❌ .env.example not found" $RED
        exit 1
    fi
else
    print_status "✅ Environment file already exists" $GREEN
fi

# Install dependencies
print_status "📦 Installing dependencies..." $BLUE
if npm install; then
    print_status "✅ Dependencies installed successfully" $GREEN
else
    print_status "❌ Failed to install dependencies" $RED
    exit 1
fi

# Success message
echo
print_status "🎉 Setup completed successfully!" $GREEN
echo
print_status "📋 Next steps:" $BLUE
echo "1. Configure: nano .env  # or your preferred editor"
echo "2. Run bot: npm start"
echo "3. Web panel: http://localhost:3000"
echo
echo "For production:"
echo "  npm install -g pm2"
echo "  pm2 start index.js --name 'video-bot'"
echo "  pm2 startup"
echo "  pm2 save"
echo
print_status "📚 Documentation: https://github.com/kevindoni/youtubebot" $BLUE
