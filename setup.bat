@echo off
echo 🤖 YouTube Bot - Windows Setup
echo ===============================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    echo 📥 Install Node.js from: https://nodejs.org/
    echo    Or use: winget install OpenJS.NodeJS
    pause
    exit /b 1
)

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git not found
    echo 📥 Install Git from: https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Create directories
if not exist "data" mkdir data
if not exist "logs" mkdir logs
echo ✅ Directories created

REM Setup environment file
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ Environment file created
        echo 📝 Please edit .env file with your configuration
    ) else (
        echo ❌ .env.example not found
        pause
        exit /b 1
    )
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Configure: notepad .env
echo 2. Run bot: npm start
echo 3. Web panel: http://localhost:3000
echo.
echo For production: npm install -g pm2
echo                pm2 start index.js --name "video-bot"
echo.
pause
