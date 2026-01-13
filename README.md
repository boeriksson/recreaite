# Recreaite

A React + TypeScript web application deployed on AWS Amplify with S3 storage and external API capabilities.

## Features

- React 18 + TypeScript + Vite
- AWS Amplify Gen 2 backend
- S3 image upload functionality
- External API integration
- Serverless Lambda functions

## Project Structure

```
recreaite/
├── src/                          # React frontend
│   ├── App.tsx                   # Main app component with upload UI
│   ├── main.tsx                  # App entry point with Amplify config
│   └── ...
├── amplify/                      # Amplify backend
│   ├── backend.ts                # Backend configuration
│   ├── storage/                  # S3 storage configuration
│   │   └── resource.ts
│   └── functions/                # Lambda functions
│       ├── upload-to-s3/         # S3 upload handler
│       └── external-api/         # External API proxy
└── package.json
```

## Local Development

### Prerequisites

- Node.js 20.x or higher
- AWS Account
- AWS CLI configured with credentials

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start Amplify sandbox (creates temporary AWS resources):
```bash
npm run amplify:sandbox
```

This will:
- Deploy backend resources to AWS
- Create an S3 bucket
- Deploy Lambda functions
- Generate `amplify_outputs.json` for frontend configuration

3. In a new terminal, start the dev server:
```bash
npm run dev
```

4. Open http://localhost:5173

## Deployment to AWS Amplify

### Step 1: Push to GitHub

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Deploy via Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "Create new app" → "Host web app"
3. Connect your GitHub repository
4. Amplify will auto-detect the configuration
5. Click "Save and deploy"

Amplify will:
- Build your React app
- Deploy your backend (Lambda functions, S3, etc.)
- Provide a live URL
- Auto-deploy on git push

### Step 3: Verify Deployment

Once deployed, test:
- Upload an image → Should save to S3
- Call external API → Should fetch data

## How It Works

### S3 Uploads

1. User selects a file in the React UI
2. Frontend calls AWS Amplify Storage API
3. Amplify handles authentication and uploads directly to S3
4. File is stored in the `images/` prefix

### External API Calls

1. Frontend makes direct fetch calls to external APIs
2. For APIs requiring secrets, use the `external-api` Lambda function
3. Lambda securely stores API keys in environment variables

## Environment Variables (for Lambda functions)

To add API keys for external services:

1. Go to Amplify Console → App Settings → Environment Variables
2. Add your keys (e.g., `API_KEY`)
3. Update `amplify/functions/external-api/handler.ts` to use them

## Building for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: AWS Amplify Gen 2
- **Storage**: Amazon S3
- **Functions**: AWS Lambda (Node.js)
- **Hosting**: AWS Amplify Hosting

## Learn More

- [AWS Amplify Docs](https://docs.amplify.aws/)
- [Amplify Gen 2 Guide](https://docs.amplify.aws/gen2/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
