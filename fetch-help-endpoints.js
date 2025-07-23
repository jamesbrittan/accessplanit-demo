#!/usr/bin/env node

const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const apiConfig = {
  baseURL: 'https://shelter.accessplanit.com/accessplansandbox',
  tokenEndpoint: '/api/v2/token',
  courseDateHelp: '/apihelp/v2/modules/courseDate',
  courseTemplateHelp: '/apihelp/v2/modules/courseTemplate',
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS
  const prefix = `[fetch-help-endpoints][${timestamp}]`;

  switch (type) {
    case 'success':
      console.log(`✅ ${prefix} ${message}`);
      break;
    case 'warn':
      console.warn(`⚠️  ${prefix} ${message}`);
      break;
    case 'error':
      console.error(`❌ ${prefix} ${message}`);
      break;
    case 'info':
    default:
      console.log(`ℹ️  ${prefix} ${message}`);
  }
};

const getToken = async () => {
  try {
    log('Fetching API token...');
    const response = await axios.post(
      `${apiConfig.baseURL}${apiConfig.tokenEndpoint}`,
      qs.stringify({
        grant_type: 'password',
        username: process.env.ACCESS_PLANIT_USER,
        password: process.env.ACCESS_PLANIT_PASS,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    log('API token retrieved successfully', 'success');
    return response.data.access_token;
  } catch (error) {
    log(`Failed to fetch API token: ${error.message}`, 'error');
    if (error.response) {
      log(`Response status: ${error.response.status}`, 'error');
      log(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
    }
    throw new Error('Failed to fetch API token.');
  }
};

const apiRequest = async (endpoint, token, params = {}) => {
  try {
    const response = await axios.get(`${apiConfig.baseURL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    log(`API request failed for ${endpoint}: ${error.message}`, 'error');
    if (error.response) {
      log(`Response status: ${error.response.status}`, 'error');
      log(`Response data: ${JSON.stringify(error.response.data)}`, 'error');
    }
    throw error;
  }
};

const fetchAndSaveHelpEndpoint = async (endpoint, filename, token) => {
  try {
    log(`Fetching ${filename}...`);
    const response = await apiRequest(endpoint, token);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'output');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `${filename}-${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(response, null, 2));
    
    log(`${filename} saved to: ${outputPath}`, 'success');
    return response;
  } catch (error) {
    log(`Failed to fetch ${filename}: ${error.message}`, 'error');
    return null;
  }
};

const main = async () => {
  try {
    log('Starting AccessPlanIt help endpoints fetch script...');
    
    // Check for required environment variables
    if (!process.env.ACCESS_PLANIT_USER || !process.env.ACCESS_PLANIT_PASS) {
      log('Missing required environment variables: ACCESS_PLANIT_USER and/or ACCESS_PLANIT_PASS', 'error');
      log('Create a .env file with these values', 'error');
      process.exit(1);
    }
    
    // Get API token
    const token = await getToken();
    
    // Fetch both help endpoints
    const [courseDateHelp, courseTemplateHelp] = await Promise.allSettled([
      fetchAndSaveHelpEndpoint(apiConfig.courseDateHelp, 'course-date-help', token),
      fetchAndSaveHelpEndpoint(apiConfig.courseTemplateHelp, 'course-template-help', token),
    ]);
    
    // Report results
    log('=== FETCH RESULTS ===');
    log(`Course Date Help: ${courseDateHelp.status === 'fulfilled' ? '✅ Success' : '❌ Failed'}`);
    log(`Course Template Help: ${courseTemplateHelp.status === 'fulfilled' ? '✅ Success' : '❌ Failed'}`);
    
    if (courseDateHelp.status === 'rejected') {
      log(`Course Date Help Error: ${courseDateHelp.reason.message}`, 'error');
    }
    
    if (courseTemplateHelp.status === 'rejected') {
      log(`Course Template Help Error: ${courseTemplateHelp.reason.message}`, 'error');
    }
    
    log('Script completed!', 'success');
    
  } catch (error) {
    log(`Script failed: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  getToken,
  apiRequest,
  fetchAndSaveHelpEndpoint,
};
