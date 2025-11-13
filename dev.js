#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting DiskusiBisnis Development Servers...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, prefix, message) {
  console.log(`${colors[color]}[${prefix}]${colors.reset} ${message}`);
}

// Start backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe',
  shell: true
});

// Start frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'pipe',
  shell: true
});

// Handle backend output
backend.stdout.on('data', (data) => {
  const message = data.toString().trim();
  if (message) {
    colorLog('blue', 'BACKEND', message);
  }
});

backend.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message && !message.includes('DeprecationWarning')) {
    colorLog('red', 'BACKEND ERROR', message);
  }
});

// Handle frontend output
frontend.stdout.on('data', (data) => {
  const message = data.toString().trim();
  if (message) {
    colorLog('green', 'FRONTEND', message);
  }
});

frontend.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message && !message.includes('DeprecationWarning')) {
    colorLog('red', 'FRONTEND ERROR', message);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
});

backend.on('close', (code) => {
  colorLog('yellow', 'BACKEND', `Process exited with code ${code}`);
});

frontend.on('close', (code) => {
  colorLog('yellow', 'FRONTEND', `Process exited with code ${code}`);
});

console.log('📊 Servers starting...');
console.log('🔗 Frontend: http://localhost:3000');
console.log('🔗 Backend:  http://localhost:5000');
console.log('📱 Mobile:   http://[YOUR-IP]:3000');
console.log('\n💡 Press Ctrl+C to stop both servers\n');
