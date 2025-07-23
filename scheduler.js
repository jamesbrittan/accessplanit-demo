#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const runScript = () => {
  log('Running fetch-help-endpoints.js...');
  
  const child = spawn('node', ['fetch-help-endpoints.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      log('Script completed successfully');
    } else {
      log(`Script exited with code ${code}`);
    }
  });
  
  child.on('error', (error) => {
    log(`Error running script: ${error.message}`);
  });
};

// Run immediately
runScript();

// Then run every 15 minutes (900,000 milliseconds)
setInterval(runScript, 15 * 60 * 1000);

log('Scheduler started - will run fetch-help-endpoints.js every 15 minutes');
log('Press Ctrl+C to stop');
