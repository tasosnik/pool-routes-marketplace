#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}\n`)
};

// Check if port is in use
function isPortInUse(port) {
  try {
    const result = execSync(`lsof -i :${port} 2>/dev/null | grep LISTEN`, { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch (e) {
    return false;
  }
}

// Kill process on port
function killPort(port) {
  try {
    execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    log.success(`Killed processes on port ${port}`);
  } catch (e) {
    // Port might not be in use
  }
}

// Check if PostgreSQL is running
function checkPostgres() {
  try {
    execSync('pg_isready -q 2>/dev/null');
    return true;
  } catch (e) {
    return false;
  }
}

// Check environment variables
function checkEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    log.error('.env file not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
  const missingVars = [];

  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    log.error(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  return true;
}

// Check backend health
async function checkBackendHealth() {
  try {
    const response = await fetch('http://localhost:3001/health');
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Check frontend health
async function checkFrontendHealth() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Test login
async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@poolroute.com',
        password: 'password123'
      })
    });
    const data = await response.json();
    return response.ok && data.success;
  } catch (e) {
    return false;
  }
}

// Commands
const commands = {
  status: async () => {
    log.header('🔍 System Status Check');

    // Check PostgreSQL
    const pgRunning = checkPostgres();
    if (pgRunning) {
      log.success('PostgreSQL is running');
    } else {
      log.error('PostgreSQL is not running');
    }

    // Check environment
    const envOk = checkEnv();
    if (envOk) {
      log.success('Environment variables configured');
    }

    // Check ports
    const backend3001 = isPortInUse(3001);
    const frontend3000 = isPortInUse(3000);

    if (backend3001) {
      log.info('Backend port 3001 is in use');
      const healthy = await checkBackendHealth();
      if (healthy) {
        log.success('Backend is healthy');

        // Test login
        const loginWorks = await testLogin();
        if (loginWorks) {
          log.success('Login endpoint working');
        } else {
          log.warning('Login endpoint not working');
        }
      } else {
        log.error('Backend is not responding');
      }
    } else {
      log.warning('Backend port 3001 is free');
    }

    if (frontend3000) {
      log.info('Frontend port 3000 is in use');
      const healthy = await checkFrontendHealth();
      if (healthy) {
        log.success('Frontend is healthy');
      } else {
        log.error('Frontend is not responding');
      }
    } else {
      log.warning('Frontend port 3000 is free');
    }
  },

  'kill-ports': () => {
    log.header('🔪 Killing processes on ports 3000 and 3001');

    killPort(3000);
    killPort(3001);

    // Also kill any node processes related to the project
    try {
      execSync('pkill -f "node.*pool-routes-marketplace" 2>/dev/null', { stdio: 'ignore' });
      execSync('pkill -f "vite" 2>/dev/null', { stdio: 'ignore' });
      execSync('pkill -f "nodemon" 2>/dev/null', { stdio: 'ignore' });
      log.success('Cleaned up all related processes');
    } catch (e) {
      // Processes might not exist
    }
  },

  reset: () => {
    log.header('🔄 Resetting development environment');

    // Kill ports
    commands['kill-ports']();

    // Clear node_modules cache if needed
    try {
      execSync('rm -rf node_modules/.cache 2>/dev/null', { stdio: 'ignore' });
      log.success('Cleared build cache');
    } catch (e) {
      // Cache might not exist
    }

    log.success('Environment reset complete');
  },

  restart: async () => {
    log.header('🚀 Restarting development servers');

    // First kill existing processes
    commands['kill-ports']();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check prerequisites
    if (!checkPostgres()) {
      log.error('PostgreSQL is not running. Please start it first.');
      process.exit(1);
    }

    if (!checkEnv()) {
      log.error('Environment configuration issues. Please fix them first.');
      process.exit(1);
    }

    // Start dev servers
    log.info('Starting development servers...');
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    devProcess.on('error', (err) => {
      log.error(`Failed to start: ${err.message}`);
    });
  },

  health: async () => {
    log.header('🏥 Health Check');

    const checks = {
      'PostgreSQL': checkPostgres(),
      'Environment': checkEnv(),
      'Backend Port (3001)': isPortInUse(3001),
      'Frontend Port (3000)': isPortInUse(3000),
      'Backend Health': await checkBackendHealth(),
      'Frontend Health': await checkFrontendHealth(),
      'Login Endpoint': await testLogin()
    };

    let allHealthy = true;
    for (const [check, result] of Object.entries(checks)) {
      if (result) {
        log.success(`${check}: OK`);
      } else {
        log.error(`${check}: FAILED`);
        allHealthy = false;
      }
    }

    console.log('');
    if (allHealthy) {
      log.success('🎉 All systems operational!');
    } else {
      log.warning('⚠️ Some systems need attention');
    }
  }
};

// Main
const command = process.argv[2];

if (!command || !commands[command]) {
  console.log(`
${colors.cyan}${colors.bright}PoolRoute OS Development Manager${colors.reset}

Usage: node scripts/dev-manager.js <command>

Commands:
  status      - Check system status
  kill-ports  - Kill processes on ports 3000 and 3001
  reset       - Reset development environment
  restart     - Restart development servers
  health      - Run comprehensive health check
  `);
  process.exit(0);
}

// Run command
(async () => {
  await commands[command]();
})();