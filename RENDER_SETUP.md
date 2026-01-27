# Render Deployment Setup Guide

## Environment Variables Required for Render

When deploying to Render, you need to set these environment variables in your Render dashboard:

### Required Environment Variables

1. **Firebase Configuration** (for authentication):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

2. **Database Configuration** (Prisma + PostgreSQL):
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
   ```
   
   **For Supabase:** Get connection string from Supabase Dashboard → Settings → Database → Connection string
   
   **Note:** This is the direct PostgreSQL connection string. Prisma will use this to connect to your database.

3. **Supabase Configuration** (Optional - if using Supabase client SDK):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

## How to Set Environment Variables in Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your web service
3. Go to **Environment** tab
4. Click **Add Environment Variable** for each variable above
5. Copy the values from your `.env.local` file (or get them from Firebase/Supabase dashboards)
6. Save and redeploy

## Build Settings

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Node Version:** Auto-detected (should be 20.x)

## Common Deployment Issues

### Issue: "Missing DATABASE_URL"
**Solution:** Make sure `DATABASE_URL` is set with your PostgreSQL connection string:
- Get from Supabase Dashboard → Settings → Database → Connection string
- Format: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require`

### Issue: "Missing Supabase environment variables"
**Solution:** Only needed if using Supabase client SDK. Make sure variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional)

### Issue: Build fails with TypeScript errors
**Solution:** 
1. Test locally first: `npm run build`
2. Fix any TypeScript errors locally
3. Commit and push changes
4. Render will rebuild automatically

### Issue: Application crashes on startup
**Solution:**
1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (required for server-side operations)

## Getting Your Credentials

### Firebase
1. Go to https://console.firebase.google.com/
2. Select your project
3. Go to Project Settings → General
4. Scroll to "Your apps" → Web app config
5. Copy the config values

### Database (PostgreSQL)
**For Supabase:**
1. Go to https://app.supabase.com/
2. Select your project
3. Go to Settings → Database
4. Find "Connection string" section
5. Copy the connection string (use "URI" format)
6. Replace `[YOUR-PASSWORD]` with your database password
7. Set as `DATABASE_URL`

**For other PostgreSQL providers:**
- Use standard PostgreSQL connection string format
- `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require`

### Supabase (Optional - if using Supabase client SDK)
1. Go to https://app.supabase.com/
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Security Reminders

- ✅ `NEXT_PUBLIC_*` variables are safe to expose to the browser
- ⚠️ `DATABASE_URL` contains database credentials - never expose to client
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses all security - only use server-side
- ❌ Never commit `.env.local` to git
- ✅ Render automatically keeps environment variables secure

## Testing Before Deploying

1. Set up `.env.local` locally with all variables
2. Run `npm run build` locally - should succeed
3. Run `npm start` locally - should start without errors
4. If local build/start works, Render deployment should work too
