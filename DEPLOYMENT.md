# Deploying to Render 

## 🚀 Quick Deployment Guide

### Step 1: Prepare Your Repository
1. Make sure all your code is committed to GitHub
2. Ensure you have the following files:
   - `render.yaml` (deployment configuration)
   - `package.json` (root package.json)
   - Environment variables ready

### Step 2: Set Up Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### Step 3: Deploy Using Blueprint
1. Click "New +" in your Render dashboard
2. Select "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to deploy

### Step 4: Configure Environment Variables
After deployment, go to your service and add:

#### Environment Variables:
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Your Firebase client email
- `FIREBASE_PRIVATE_KEY` - Your Firebase private key
- `NODE_ENV` - Set to "production"

### Step 5: Database Setup
1. Render will automatically create a PostgreSQL database
2. The database connection string will be automatically injected
3. Run database migrations: `npx prisma migrate deploy`

## 🌐 Single URL Deployment

Your entire application will be available at:
- **Single URL**: `https://marcan-marketplace.onrender.com`
- **Frontend**: Same URL
- **Backend API**: `https://marcan-marketplace.onrender.com/api`
- **Database**: Automatically managed by Render

## 🔧 How It Works

1. **Single Web Service**: Both frontend and backend run on the same server
2. **Static File Serving**: Express serves the built React app
3. **API Routing**: All `/api/*` requests go to your Node.js backend
4. **SPA Routing**: All other requests serve the React app for client-side routing

## 📁 Project Structure After Deployment

```
https://marcan-marketplace.onrender.com/
├── / (React App - Homepage)
├── /listings (React App - Listings Page)
├── /login (React App - Login Page)
├── /api/users (Backend API)
├── /api/listings (Backend API)
└── /api/chat (Backend API)
```

## 🔄 Automatic Deployments
- Render automatically deploys on git push
- You can configure branch-specific deployments
- Set up preview deployments for pull requests

## 💰 Cost
- **Free tier**: $0/month
- **Database**: Free for small apps
- **Bandwidth**: Generous limits
- **Build minutes**: 750 hours/month free

## 🆘 Troubleshooting
- Check build logs for errors
- Verify environment variables
- Ensure database migrations ran
- Check that the React build is successful
- Verify static file serving is working

## 🚀 Benefits of Single URL Deployment
- ✅ Only one URL to manage
- ✅ No CORS issues
- ✅ Simpler deployment
- ✅ Better user experience
- ✅ Easier domain management
- ✅ Lower costs (one service instead of two) 