# Environment Variables Setup

## Quick Start

1. Copy the example file to create your local environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your actual credentials in `.env.local`

## Firebase Configuration

Get your Firebase credentials from:
- Firebase Console: https://console.firebase.google.com/
- Project Settings → General → Your apps → Web app config

Required variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Usually `your-project-id.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Usually `your-project-id.appspot.com`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Your messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Your Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Your Google Analytics measurement ID (optional)

## Supabase Configuration

Get your Supabase credentials from:
- Supabase Dashboard: https://app.supabase.com/
- Project Settings → API

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

Optional:
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, never expose to client)

## Cloudinary Configuration

Get your Cloudinary credentials from:
- Cloudinary Dashboard: https://cloudinary.com/console

Required variables:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `NEXT_PUBLIC_CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret (server-side only)

## Security Notes

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Use `NEXT_PUBLIC_` prefix for variables that need to be accessible in the browser
- Variables without `NEXT_PUBLIC_` are server-side only
- Keep sensitive keys (like service role keys and API secrets) server-side only
