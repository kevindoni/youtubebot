#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');
const { execSync } = require('child_process');

class StatusDashboard {
    constructor() {
        this.servers = [
            { name: 'Main Server', url: 'http://localhost:3000', type: 'production' },
            { name: 'Dev Server', url: 'http://localhost:3001', type: 'development' }
        ];
    }

    async checkServerHealth(server) {
        try {
            const response = await axios.get(`${server.url}/health`, { timeout: 5000 });
            return {
                ...server,
                status: 'online',
                health: response.data,
                responseTime: response.headers['x-response-time'] || 'N/A'
            };
        } catch (error) {
            return {
                ...server,
                status: 'offline',
                error: error.message,
                health: null
            };
        }
    }

    checkPM2Status() {
        try {
            const output = execSync('pm2 jlist', { encoding: 'utf8' });
            return JSON.parse(output);
        } catch (error) {
            return [];
        }
    }

    checkDockerStatus() {
        try {
            const output = execSync('docker-compose ps --format json', { encoding: 'utf8' });
            return output.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
        } catch (error) {
            return [];
        }
    }

    checkSystemResources() {
        try {
            // Get system info
            const platform = process.platform;
            const arch = process.arch;
            const nodeVersion = process.version;
            const uptime = process.uptime();
            const memory = process.memoryUsage();

            return {
                platform,
                arch,
                nodeVersion,
                uptime: Math.floor(uptime / 60), // minutes
                memory: {
                    used: Math.round(memory.heapUsed / 1024 / 1024), // MB
                    total: Math.round(memory.heapTotal / 1024 / 1024), // MB
                    external: Math.round(memory.external / 1024 / 1024) // MB
                }
            };
        } catch (error) {
            return null;
        }
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    formatMemory(bytes) {
        const gb = bytes / (1024 * 1024 * 1024);
        if (gb >= 1) {
            return `${gb.toFixed(1)}GB`;
        }
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(0)}MB`;
    }

    getStatusColor(status) {
        switch (status?.toLowerCase()) {
            case 'healthy':
            case 'online':
            case 'running':
                return chalk.green;
            case 'unhealthy':
            case 'offline':
            case 'stopped':
                return chalk.red;
            case 'starting':
            case 'restarting':
                return chalk.yellow;
            default:
                return chalk.gray;
        }
    }

    displayHeader() {
        console.clear();
        console.log(chalk.cyan.bold('🚀 YouTube Bot - System Status Dashboard'));
        console.log(chalk.gray('='.repeat(60)));
        console.log(chalk.blue(`Timestamp: ${new Date().toLocaleString()}`));
        console.log();
    }

    displayServerStatus(servers) {
        console.log(chalk.yellow.bold('📡 Server Status:'));
        console.log();

        servers.forEach(server => {
            const statusColor = this.getStatusColor(server.status);
            console.log(`${statusColor('●')} ${chalk.bold(server.name)} (${server.type})`);
            console.log(`   URL: ${chalk.blue(server.url)}`);
            console.log(`   Status: ${statusColor(server.status)}`);

            if (server.health) {
                console.log(`   Uptime: ${chalk.green(this.formatUptime(server.health.uptime))}`);
                console.log(`   Memory: ${chalk.blue(this.formatMemory(server.health.memory.rss * 1024 * 1024))}`);
                console.log(`   Active Bots: ${chalk.cyan(`${server.health.bots.active}/${server.health.bots.total}`)}`);
                
                if (server.health.antiDetection?.proxyStats) {
                    const ps = server.health.antiDetection.proxyStats;
                    const workingPercent = ps.total > 0 ? (ps.working / ps.total * 100).toFixed(1) : 0;
                    const proxyColor = workingPercent > 80 ? chalk.green : workingPercent > 50 ? chalk.yellow : chalk.red;
                    console.log(`   Proxies: ${proxyColor(`${ps.working}/${ps.total}`)} (${workingPercent}%)`);
                }
            } else if (server.error) {
                console.log(`   Error: ${chalk.red(server.error)}`);
            }
            console.log();
        });
    }

    displayPM2Status(processes) {
        if (processes.length === 0) {
            console.log(chalk.gray('📋 PM2: No processes running'));
            console.log();
            return;
        }

        console.log(chalk.yellow.bold('📋 PM2 Processes:'));
        console.log();

        processes.forEach(proc => {
            const statusColor = this.getStatusColor(proc.pm2_env.status);
            console.log(`${statusColor('●')} ${chalk.bold(proc.name)} (${proc.pm2_env.exec_mode})`);
            console.log(`   Status: ${statusColor(proc.pm2_env.status)}`);
            console.log(`   PID: ${chalk.blue(proc.pid || 'N/A')}`);
            console.log(`   Uptime: ${chalk.green(this.formatUptime(Math.floor((Date.now() - proc.pm2_env.pm_uptime) / 1000)))}`);
            console.log(`   Memory: ${chalk.blue(this.formatMemory(proc.monit.memory))}`);
            console.log(`   CPU: ${chalk.cyan(proc.monit.cpu + '%')}`);
            console.log(`   Restarts: ${chalk.yellow(proc.pm2_env.restart_time)}`);
            console.log();
        });
    }

    displayDockerStatus(containers) {
        if (containers.length === 0) {
            console.log(chalk.gray('🐳 Docker: No containers running'));
            console.log();
            return;
        }

        console.log(chalk.yellow.bold('🐳 Docker Containers:'));
        console.log();

        containers.forEach(container => {
            const statusColor = this.getStatusColor(container.State);
            console.log(`${statusColor('●')} ${chalk.bold(container.Name || container.Service)}`);
            console.log(`   Status: ${statusColor(container.State)}`);
            console.log(`   Ports: ${chalk.blue(container.Ports || 'N/A')}`);
            console.log();
        });
    }

    displaySystemInfo(system) {
        if (!system) return;

        console.log(chalk.yellow.bold('💻 System Information:'));
        console.log();
        console.log(`   Platform: ${chalk.blue(system.platform)} (${system.arch})`);
        console.log(`   Node.js: ${chalk.green(system.nodeVersion)}`);
        console.log(`   Dashboard Uptime: ${chalk.cyan(system.uptime + ' minutes')}`);
        console.log(`   Memory Usage: ${chalk.blue(system.memory.used + 'MB')} / ${chalk.blue(system.memory.total + 'MB')}`);
        console.log();
    }

    displayQuickActions() {
        console.log(chalk.yellow.bold('⚡ Quick Actions:'));
        console.log();
        console.log(`   ${chalk.green('npm run monitor')}        - Start performance monitor`);
        console.log(`   ${chalk.green('npm run pm2:status')}     - Show PM2 status`);
        console.log(`   ${chalk.green('npm run pm2:logs')}       - Show PM2 logs`);
        console.log(`   ${chalk.green('pm2 monit')}              - PM2 monitoring dashboard`);
        console.log(`   ${chalk.green('docker-compose ps')}      - Docker container status`);
        console.log();
        console.log(chalk.gray('Press Ctrl+C to exit, or wait 30 seconds for auto-refresh'));
    }

    async run() {
        try {
            this.displayHeader();

            // Check server health
            const serverChecks = await Promise.all(
                this.servers.map(server => this.checkServerHealth(server))
            );
            this.displayServerStatus(serverChecks);

            // Check PM2 status
            const pm2Processes = this.checkPM2Status();
            this.displayPM2Status(pm2Processes);

            // Check Docker status
            const dockerContainers = this.checkDockerStatus();
            this.displayDockerStatus(dockerContainers);

            // System information
            const systemInfo = this.checkSystemResources();
            this.displaySystemInfo(systemInfo);

            // Quick actions
            this.displayQuickActions();

        } catch (error) {
            console.error(chalk.red('Error generating status dashboard:'), error.message);
        }
    }

    async startWatch() {
        console.log(chalk.green('🚀 Starting YouTube Bot Status Dashboard...'));
        console.log(chalk.blue('Refreshing every 30 seconds'));
        console.log();

        // Initial run
        await this.run();

        // Auto-refresh every 30 seconds
        const interval = setInterval(async () => {
            await this.run();
        }, 30000);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            clearInterval(interval);
            console.log(chalk.yellow('\n👋 Status dashboard stopped'));
            process.exit(0);
        });
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const dashboard = new StatusDashboard();

    if (args.includes('--watch') || args.includes('-w')) {
        await dashboard.startWatch();
    } else {
        await dashboard.run();
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = StatusDashboard;
