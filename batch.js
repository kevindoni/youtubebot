const VideoBot = require('./index');
const AntiDetectionManager = require('./anti-detection');
const chalk = require('chalk');

// Example configuration for batch processing with anti-detection
const videoList = [
    {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
            like: true,
            comment: true,
            watchTime: 45000, // 45 seconds
            customComment: 'Amazing content! Thanks for sharing! 🔥'
        }
    },
    {
        url: 'https://www.youtube.com/watch?v=example2',
        options: {
            like: true,
            comment: true,
            watchTime: 30000, // 30 seconds
            // Will use random comment
        }
    },
    {
        url: 'https://www.youtube.com/watch?v=example3',
        options: {
            like: true,
            comment: false,
            watchTime: 60000 // 1 minute
        }
    }
];

async function runBatch() {
    const bot = new VideoBot();
    const antiDetection = new AntiDetectionManager();
    
    try {
        console.log(chalk.cyan('🚀 Starting batch video processing with anti-detection...'));
        await bot.init();
        
        // Check if timing is optimal
        const timingCheck = antiDetection.isOptimalTime();
        console.log(chalk.blue(`⏰ Timing Analysis: ${timingCheck.recommendation} (Score: ${timingCheck.score.toFixed(2)})`));
        
        for (let i = 0; i < videoList.length; i++) {
            const video = videoList[i];
            console.log(chalk.magenta(`\n📹 Processing video ${i + 1}/${videoList.length}: ${video.url}`));
            
            // Display current anti-detection status
            const adStats = antiDetection.getStats();
            console.log(chalk.gray(`🛡️  Using proxy: ${adStats.proxy.working} working proxies`));
            console.log(chalk.gray(`👤 Current location: ${adStats.behavior.profile.location.city}, ${adStats.behavior.profile.location.country}`));
            console.log(chalk.gray(`🌐 Browser: ${adStats.behavior.profile.browser.name} ${adStats.behavior.profile.browser.version}`));
            
            try {
                await bot.watchVideo(video.url, video.options);
                console.log(chalk.green(`✅ Video ${i + 1} completed successfully`));
            } catch (error) {
                console.error(chalk.red(`❌ Error processing video ${i + 1}:`), error.message);
                // Continue with next video
            }
            
            // Random delay between videos (5-15 seconds)
            if (i < videoList.length - 1) {
                const delay = Math.random() * 10000 + 5000;
                console.log(chalk.yellow(`⏳ Waiting ${Math.round(delay/1000)} seconds before next video...`));
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        console.log(chalk.cyan('\n🎉 Batch processing completed!'));
        console.log(chalk.gray('📊 Final Statistics:'));
        console.log(bot.getStats());
        
    } catch (error) {
        console.error(chalk.red('❌ Batch processing failed:'), error.message);
    } finally {
        await bot.cleanup();
    }
}

// Run batch processing
if (require.main === module) {
    runBatch();
}

module.exports = { videoList, runBatch };
