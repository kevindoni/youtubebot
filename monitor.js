#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class PerformanceMonitor {
    constructor(options = {}) {
        this.serverUrl = options.serverUrl || 'http://localhost:3000';
        this.interval = options.interval || 30000; // 30 seconds
        this.logFile = options.logFile || path.join(__dirname, 'logs', 'performance.log');
        this.alertThresholds = {
            memory: options.memoryThreshold || 80, // 80% memory usage
            responseTime: options.responseTimeThreshold || 2000, // 2 seconds
            uptime: options.uptimeThreshold || 3600 // 1 hour minimum uptime
        };
        this.isRunning = false;
        this.stats = {
            totalChecks: 0,
            successfulChecks: 0,
            failures: 0,
            alerts: 0
        };
    }

    async checkHealth() {
        try {
            const startTime = Date.now();
            const response = await axios.get(`${this.serverUrl}/health`, {
                timeout: 5000
            });
            const responseTime = Date.now() - startTime;
            
            const healthData = response.data;
            const timestamp = new Date().toISOString();
            
            this.stats.totalChecks++;
            this.stats.successfulChecks++;
            
            // Check for alerts
            const alerts = this.checkAlerts(healthData, responseTime);
            
            // Log the health check
            const logEntry = {
                timestamp,
                responseTime,
                ...healthData,
                alerts
            };
            
            this.logHealthCheck(logEntry);
            this.displayStatus(logEntry);
            
            return logEntry;
            
        } catch (error) {
            this.stats.totalChecks++;
            this.stats.failures++;
            
            const errorEntry = {
                timestamp: new Date().toISOString(),
                error: error.message,
                type: 'connection_error'
            };
            
            this.logHealthCheck(errorEntry);
            console.log(chalk.red(`❌ Health check failed: ${error.message}`));
            
            return errorEntry;
        }
    }

    checkAlerts(healthData, responseTime) {
        const alerts = [];
        
        // Memory usage alert
        const memoryPercent = (healthData.memory.used / healthData.memory.total) * 100;
        if (memoryPercent > this.alertThresholds.memory) {
            alerts.push({
                type: 'high_memory',
                message: `Memory usage: ${memoryPercent.toFixed(1)}%`,
                severity: 'warning'
            });
        }
        
        // Response time alert
        if (responseTime > this.alertThresholds.responseTime) {
            alerts.push({
                type: 'slow_response',
                message: `Response time: ${responseTime}ms`,
                severity: 'warning'
            });
        }
        
        // Low uptime alert
        if (healthData.uptime < this.alertThresholds.uptime) {
            alerts.push({
                type: 'low_uptime',
                message: `Server uptime: ${Math.floor(healthData.uptime / 60)} minutes`,
                severity: 'info'
            });
        }
        
        // Bot issues
        if (healthData.bots && healthData.bots.total > 0 && healthData.bots.active === 0) {
            alerts.push({
                type: 'no_active_bots',
                message: 'No active bots running',
                severity: 'warning'
            });
        }
        
        // Proxy issues
        if (healthData.antiDetection && healthData.antiDetection.proxyStats) {
            const proxyStats = healthData.antiDetection.proxyStats;
            const workingPercentage = (proxyStats.working / proxyStats.total) * 100;
            
            if (workingPercentage < 50 && proxyStats.total > 0) {
                alerts.push({
                    type: 'low_proxy_health',
                    message: `Working proxies: ${workingPercentage.toFixed(1)}%`,
                    severity: 'critical'
                });
            }
        }
        
        if (alerts.length > 0) {
            this.stats.alerts++;
        }
        
        return alerts;
    }

    displayStatus(data) {
        console.clear();
        console.log(chalk.cyan.bold('🚀 YouTube Bot Performance Monitor'));
        console.log(chalk.gray('=' .repeat(50)));
        
        // Server status
        const statusColor = data.status === 'healthy' ? chalk.green : chalk.red;
        console.log(`Status: ${statusColor(data.status || 'error')}`);
        console.log(`Timestamp: ${chalk.blue(data.timestamp)}`);
        
        if (data.uptime !== undefined) {
            const uptimeHours = Math.floor(data.uptime / 3600);
            const uptimeMinutes = Math.floor((data.uptime % 3600) / 60);
            console.log(`Uptime: ${chalk.yellow(`${uptimeHours}h ${uptimeMinutes}m`)}`);
        }
        
        if (data.responseTime !== undefined) {
            const responseColor = data.responseTime < 1000 ? chalk.green : 
                                 data.responseTime < 2000 ? chalk.yellow : chalk.red;
            console.log(`Response Time: ${responseColor(`${data.responseTime}ms`)}`);
        }
        
        // Memory info
        if (data.memory) {
            const memoryPercent = (data.memory.used / data.memory.total) * 100;
            const memoryColor = memoryPercent < 70 ? chalk.green : 
                               memoryPercent < 85 ? chalk.yellow : chalk.red;
            console.log(`Memory: ${memoryColor(`${memoryPercent.toFixed(1)}%`)} (${data.memory.used}GB/${data.memory.total}GB)`);
            console.log(`RSS: ${chalk.blue(`${data.memory.rss}MB`)}`);
        }
        
        // Bot info
        if (data.bots) {
            console.log(`Bots: ${chalk.cyan(`${data.bots.active}/${data.bots.total}`)} active`);
        }
        
        // Proxy info  
        if (data.antiDetection && data.antiDetection.proxyStats) {
            const ps = data.antiDetection.proxyStats;
            const workingPercent = ps.total > 0 ? (ps.working / ps.total * 100).toFixed(1) : 0;
            const proxyColor = workingPercent > 80 ? chalk.green : 
                              workingPercent > 50 ? chalk.yellow : chalk.red;
            console.log(`Proxies: ${proxyColor(`${ps.working}/${ps.total}`)} (${workingPercent}%)`);
            
            if (ps.averageResponseTime > 0) {
                console.log(`Avg Response: ${chalk.blue(`${ps.averageResponseTime}ms`)}`);
            }
        }
        
        // Alerts
        if (data.alerts && data.alerts.length > 0) {
            console.log(chalk.yellow('\n⚠️  Alerts:'));
            data.alerts.forEach(alert => {
                const color = alert.severity === 'critical' ? chalk.red :
                             alert.severity === 'warning' ? chalk.yellow : chalk.blue;
                console.log(`  ${color(`• ${alert.message}`)}`);
            });
        }
        
        // Statistics
        console.log(chalk.gray('\n' + '='.repeat(50)));
        console.log(`Total Checks: ${chalk.blue(this.stats.totalChecks)}`);
        console.log(`Success Rate: ${chalk.green((this.stats.successfulChecks / this.stats.totalChecks * 100 || 0).toFixed(1))}%`);
        console.log(`Failures: ${chalk.red(this.stats.failures)}`);
        console.log(`Alerts: ${chalk.yellow(this.stats.alerts)}`);
        
        console.log(chalk.gray(`\nNext check in ${this.interval / 1000} seconds...`));
    }

    logHealthCheck(data) {
        const logEntry = `${JSON.stringify(data)}\n`;
        
        // Ensure logs directory exists
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        fs.appendFileSync(this.logFile, logEntry);
    }

    async start() {
        if (this.isRunning) {
            console.log(chalk.yellow('Monitor is already running'));
            return;
        }
        
        this.isRunning = true;
        console.log(chalk.green(`🚀 Starting performance monitor...`));
        console.log(chalk.blue(`Server: ${this.serverUrl}`));
        console.log(chalk.blue(`Interval: ${this.interval / 1000}s`));
        console.log(chalk.blue(`Log file: ${this.logFile}`));
        
        // Initial check
        await this.checkHealth();
        
        // Schedule regular checks
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.checkHealth();
            }
        }, this.interval);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.stop();
        });
        
        process.on('SIGTERM', () => {
            this.stop();
        });
    }

    stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        console.log(chalk.yellow('\n📊 Performance Monitor Statistics:'));
        console.log(chalk.blue(`Total Checks: ${this.stats.totalChecks}`));
        console.log(chalk.green(`Successful: ${this.stats.successfulChecks}`));
        console.log(chalk.red(`Failures: ${this.stats.failures}`));
        console.log(chalk.yellow(`Alerts: ${this.stats.alerts}`));
        console.log(chalk.gray(`Success Rate: ${(this.stats.successfulChecks / this.stats.totalChecks * 100 || 0).toFixed(1)}%`));
        
        console.log(chalk.green('\n✅ Performance monitor stopped'));
        process.exit(0);
    }

    // CLI interface
    static async cli() {
        const args = process.argv.slice(2);
        const options = {};
        
        // Parse command line arguments
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            const value = args[i + 1];
            
            switch (key) {
                case '--url':
                    options.serverUrl = value;
                    break;
                case '--interval':
                    options.interval = parseInt(value) * 1000;
                    break;
                case '--memory-threshold':
                    options.memoryThreshold = parseInt(value);
                    break;
                case '--response-threshold':
                    options.responseTimeThreshold = parseInt(value);
                    break;
                case '--log-file':
                    options.logFile = value;
                    break;
            }
        }
        
        const monitor = new PerformanceMonitor(options);
        await monitor.start();
    }
}

// Run CLI if this file is executed directly
if (require.main === module) {
    PerformanceMonitor.cli().catch(console.error);
}

module.exports = PerformanceMonitor;
