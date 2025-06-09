#!/usr/bin/env node

/**
 * Cross-Platform Setup Script for YouTube Bot
 * Automatically detects OS and provides appropriate setup instructions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    yellow: '\x1b[33m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function detectOS() {
    const platform = process.platform;
    switch (platform) {
        case 'win32':
            return 'Windows';
        case 'darwin':
            return 'macOS';
        case 'linux':
            return 'Linux';
        default:
            return 'Unknown';
    }
}

function checkNodeVersion() {
    try {
        const version = execSync('node --version', { encoding: 'utf8' }).trim();
        const majorVersion = parseInt(version.slice(1).split('.')[0]);
        
        if (majorVersion >= 18) {
            log(`✅ Node.js ${version} detected (compatible)`, 'green');
            return true;
        } else {
            log(`❌ Node.js ${version} detected (requires v18+)`, 'red');
            return false;
        }
    } catch (error) {
        log('❌ Node.js not found', 'red');
        return false;
    }
}

function checkGit() {
    try {
        const version = execSync('git --version', { encoding: 'utf8' }).trim();
        log(`✅ ${version} detected`, 'green');
        return true;
    } catch (error) {
        log('❌ Git not found', 'red');
        return false;
    }
}

function setupEnvironment() {
    const envExample = path.join(__dirname, '.env.example');
    const envFile = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envFile)) {
        if (fs.existsSync(envExample)) {
            fs.copyFileSync(envExample, envFile);
            log('✅ Environment file created (.env)', 'green');
            log('📝 Please edit .env file with your configuration', 'yellow');
            return true;
        } else {
            log('❌ .env.example not found', 'red');
            return false;
        }
    } else {
        log('✅ Environment file already exists', 'green');
        return true;
    }
}

function createDirectories() {
    const dirs = ['data', 'logs'];
    let success = true;
    
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            try {
                fs.mkdirSync(dirPath, { recursive: true });
                log(`✅ Created directory: ${dir}`, 'green');
            } catch (error) {
                log(`❌ Failed to create directory: ${dir}`, 'red');
                success = false;
            }
        } else {
            log(`✅ Directory exists: ${dir}`, 'green');
        }
    });
    
    return success;
}

function installDependencies() {
    try {
        log('📦 Installing dependencies...', 'blue');
        execSync('npm install', { stdio: 'inherit' });
        log('✅ Dependencies installed successfully', 'green');
        return true;
    } catch (error) {
        log('❌ Failed to install dependencies', 'red');
        return false;
    }
}

function showNextSteps(os) {
    log('\n🎉 Setup completed successfully!', 'green');
    log('\n📋 Next steps:', 'bright');
    
    log('\n1. Configure your environment:', 'blue');
    if (os === 'Windows') {
        log('   notepad .env');
    } else {
        log('   nano .env   # or your preferred editor');
    }
    
    log('\n2. Run the bot:', 'blue');
    log('   npm start');
    
    log('\n3. Access web panel:', 'blue');
    log('   http://localhost:3000');
    
    log('\n4. For production deployment:', 'blue');
    log('   npm install -g pm2');
    log('   pm2 start index.js --name "video-bot"');
    
    log('\n📚 Documentation: https://github.com/kevindoni/youtubebot', 'blue');
}

function main() {
    log('🤖 YouTube Bot Setup Script', 'bright');
    log('=============================\n', 'bright');
    
    const os = detectOS();
    log(`🖥️  Operating System: ${os}`, 'blue');
    
    // Check prerequisites
    log('\n🔍 Checking prerequisites...', 'blue');
    const nodeOk = checkNodeVersion();
    const gitOk = checkGit();
    
    if (!nodeOk) {
        log('\n📥 Install Node.js v18+ from: https://nodejs.org/', 'yellow');
        if (os === 'Windows') {
            log('   Or use: winget install OpenJS.NodeJS', 'yellow');
        }
        process.exit(1);
    }
    
    if (!gitOk) {
        log('\n📥 Install Git from: https://git-scm.com/', 'yellow');
        process.exit(1);
    }
    
    // Setup process
    log('\n⚙️  Setting up environment...', 'blue');
    
    const steps = [
        { name: 'Creating directories', fn: createDirectories },
        { name: 'Setting up environment file', fn: setupEnvironment },
        { name: 'Installing dependencies', fn: installDependencies }
    ];
    
    let allSuccess = true;
    for (const step of steps) {
        log(`\n▶️  ${step.name}...`, 'blue');
        if (!step.fn()) {
            allSuccess = false;
            break;
        }
    }
    
    if (allSuccess) {
        showNextSteps(os);
    } else {
        log('\n❌ Setup failed. Please check the errors above.', 'red');
        process.exit(1);
    }
}

// Run setup if called directly
if (require.main === module) {
    main();
}

module.exports = { main, detectOS, checkNodeVersion };
