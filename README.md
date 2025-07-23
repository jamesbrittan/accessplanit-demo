# AccessPlanIt API Test Suite

A standalone Node.js project for testing and exploring the AccessPlanIt API endpoints.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` and add your AccessPlanIt credentials:
   ```
   ACCESS_PLANIT_USER=your_username
   ACCESS_PLANIT_PASS=your_password
   ```

## Usage

### Fetch Help Endpoints
Get API documentation for course dates and course templates:
```bash
npm run help
```

### Fetch Course Data
Get actual course data (templates and dates):
```bash
npm run fetch
```

### Run Individual Scripts
```bash
# Help endpoints only
node fetch-help-endpoints.js

# Course data only
node fetch-course-data.js
```

## Output

All fetched data is saved to the `output/` directory with timestamps:
- `course-date-help-{timestamp}.json` - Lists modules available to the course date endpoint
- `course-template-help-{timestamp}.json` - Lists modules available to the course template endpoint  
- `course-templates-{timestamp}.json` - Actual course template data
- `course-dates-{timestamp}.json` - Actual course date data

## API Endpoints

The scripts connect to:
- **Base URL**: `https://shelter.accessplanit.com/accessplansandbox`
- **Token Endpoint**: `/api/v2/token`
- **Course Dates**: `/api/v2/coursedate`
- **Course Templates**: `/api/v2/coursetemplate`
- **Course Date Help**: `/apihelp/v2/modules/courseDate`
- **Course Template Help**: `/apihelp/v2/modules/courseTemplate`

