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
  courseDatesEndpoint: '/api/v2/coursedate',
  courseTemplatesEndpoint: '/api/v2/coursetemplate',
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS
  const prefix = `[fetch-course-data][${timestamp}]`;

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

const fetchCourseTemplates = async (token, limit = 10) => {
  try {
    log(`Fetching course templates (limit: ${limit})...`);
    const params = {
      $top: limit,
      $orderby: 'Name asc',
    };
    
    const response = await apiRequest(apiConfig.courseTemplatesEndpoint, token, params);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'output');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `course-templates-${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(response, null, 2));
    
    log(`Course templates saved to: ${outputPath}`, 'success');
    log(`Retrieved ${response.results?.length || 0} course templates`);
    
    return response;
  } catch (error) {
    log(`Failed to fetch course templates: ${error.message}`, 'error');
    return null;
  }
};

const fetchCourseDates = async (token, limit = 10) => {
  try {
    log(`Fetching course dates (limit: ${limit})...`);
    const params = {
      $top: limit,
      $orderby: 'StartDate asc',
      // Uncomment to filter by specific criteria
      // $filter: `CF_Include_on_Shelter_website eq true`,
    };
    
    const response = await apiRequest(apiConfig.courseDatesEndpoint, token, params);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'output');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `course-dates-${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(response, null, 2));
    
    log(`Course dates saved to: ${outputPath}`, 'success');
    log(`Retrieved ${response.results?.length || 0} course dates`);
    
    return response;
  } catch (error) {
    log(`Failed to fetch course dates: ${error.message}`, 'error');
    return null;
  }
};

const main = async () => {
  try {
    log('Starting AccessPlanIt course data fetch script...');
    
    // Check for required environment variables
    if (!process.env.ACCESS_PLANIT_USER || !process.env.ACCESS_PLANIT_PASS) {
      log('Missing required environment variables: ACCESS_PLANIT_USER and/or ACCESS_PLANIT_PASS', 'error');
      log('Create a .env file with these values', 'error');
      process.exit(1);
    }
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const limitIndex = args.indexOf('--limit');
    const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1]) : 10;
    
    log(`Using limit: ${limit}`);
    
    // Get API token
    const token = await getToken();
    
    // Fetch both course data endpoints
    const [courseTemplates, courseDates] = await Promise.allSettled([
      fetchCourseTemplates(token, limit),
      fetchCourseDates(token, limit),
    ]);
    
    // Report results
    log('=== FETCH RESULTS ===');
    log(`Course Templates: ${courseTemplates.status === 'fulfilled' ? '✅ Success' : '❌ Failed'}`);
    log(`Course Dates: ${courseDates.status === 'fulfilled' ? '✅ Success' : '❌ Failed'}`);
    
    if (courseTemplates.status === 'rejected') {
      log(`Course Templates Error: ${courseTemplates.reason.message}`, 'error');
    }
    
    if (courseDates.status === 'rejected') {
      log(`Course Dates Error: ${courseDates.reason.message}`, 'error');
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
  fetchCourseTemplates,
  fetchCourseDates,
};
