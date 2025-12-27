# Vercel Environment Variables Setup

This document lists all environment variables that need to be set in Vercel.

## Quick Setup via Vercel Dashboard

1. Go to your Vercel project settings:
   - Navigate: **Dashboard** → **fealty-api** → **Settings** → **Environment Variables**
   - Or go directly to: `https://vercel.com/[your-team]/fealty-api/settings/environment-variables`
2. Add each variable below for **Production**, **Preview**, and **Development** environments

## Environment Variables

### Node Setup
```
# Note: TZ is a reserved system variable and cannot be set in Vercel
# Timezone is handled by Vercel's server settings
```

### Payload Setup
```
PAYLOAD_SECRET=d51387b19ec73a5cdb49a91e
DATABASE_URI=mongodb://127.0.0.1:27017/payload  # ⚠️ Update to MongoDB Atlas for production
PAYLOAD_SERVER_URL=http://localhost:4000  # ⚠️ Update to Vercel URL for production
PAYLOAD_SERVER_PORT=4000
PAYLOAD_PUBLIC_CORS_CSRF_URLS=http://localhost:4000,exp://localhost:8081  # ⚠️ For admin panel + React Native dev
PAYLOAD_PUBLIC_FRONTEND_URL=http://localhost:4000  # ⚠️ Not used by mobile app, only for admin panel
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:4000  # ⚠️ Update to Vercel URL for production
```

### Email Setup
```
MAIL_ADAPTER=resend
MAIL_API_KEY=re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz
EMAIL_FROM_ADDRESS=noreply@deelbaar.com  # ⚠️ Fallback only - use Mail global in Payload UI
EMAIL_FROM_NAME=Fealty  # ⚠️ Fallback only - configure in Mail global in Payload UI
```

### Alternative Email Variables (for compatibility)
```
RESEND_API_KEY=re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz
RESEND_FROM_EMAIL=noreply@deelbaar.com  # ⚠️ Fallback only - use Mail global in Payload UI
RESEND_FROM_NAME=Fealty  # ⚠️ Fallback only - configure in Mail global in Payload UI
```

**Note**: The email "From" address and name can be configured in the Payload admin panel:
1. Go to **Globals** → **Mail** in the Payload admin
2. Set the **From email address** field
3. This will override the environment variables when sending emails
4. Environment variables are used as fallback/defaults

### Jobs
```
ENABLE_PAYLOAD_AUTORUN=true
CRON_SECRET=your-secure-random-string-here  # ⚠️ Generate a secure random string
```

## Setup via CLI

You can also add them via CLI (you'll be prompted for values):

```powershell
# Node setup
pnpm vercel env add TZ production
pnpm vercel env add TZ preview
pnpm vercel env add TZ development

# Payload setup
pnpm vercel env add PAYLOAD_SECRET production
pnpm vercel env add DATABASE_URI production
pnpm vercel env add PAYLOAD_SERVER_URL production
# ... etc
```

## Important Notes for Production

⚠️ **These values need to be updated for production:**

### Production Setup (React Native Frontend)

Since your frontend is a React Native app (not a web app), the setup is slightly different:

1. **DATABASE_URI**: 
   - ❌ Current: `mongodb://127.0.0.1:27017/payload` (localhost - won't work on Vercel)
   - ✅ Production: MongoDB Atlas connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/fealty?retryWrites=true&w=majority`
   - **Action**: Create a MongoDB Atlas cluster and get the connection string

2. **PAYLOAD_SERVER_URL**: 
   - ❌ Current: `http://localhost:4000`
   - ✅ Production: Your Vercel deployment URL (will be generated after first deploy)
   - Example: `https://fealty-api.vercel.app` or `https://fealty-api-pjiepsmas-projects.vercel.app`
   - **Action**: Deploy first, then update with the actual URL

3. **PAYLOAD_PUBLIC_CORS_CSRF_URLS**: 
   - ⚠️ For React Native apps, CORS doesn't apply (it's for browsers)
   - Only needed for:
     - Payload admin panel access (web-based, accessed via browser)
     - React Native development (Expo dev server uses `exp://` protocol)
   - Development: `http://localhost:4000,exp://localhost:8081` (API + Expo dev server)
   - Production: `https://fealty-api.vercel.app` (just the API URL for admin panel)
   - **Note**: Your React Native app doesn't need CORS, but the admin panel does

4. **PAYLOAD_PUBLIC_FRONTEND_URL**: 
   - ⚠️ Not used by React Native mobile app (mobile apps don't have a "frontend URL")
   - Only used by Payload admin panel (web-based)
   - Can be set to your API URL: `https://fealty-api.vercel.app`
   - Or leave as `http://localhost:4000` for development

5. **PAYLOAD_PUBLIC_SERVER_URL**: 
   - ❌ Current: `http://localhost:4000`
   - ✅ Production: Your Vercel deployment URL
   - Example: `https://fealty-api.vercel.app`
   - **Action**: Update after first deployment with actual Vercel URL

6. **CRON_SECRET**: 
   - ❌ Current: `your-secure-random-string-here`
   - ✅ Production: Generate a secure random string
   - **Action**: Generate using: `openssl rand -hex 32` or use a password generator
   - This secures your `/api/cron` endpoint

## Production Setup Steps

### Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/fealty?retryWrites=true&w=majority`
5. Whitelist Vercel IPs (or use `0.0.0.0/0` for all - less secure but easier)

### Step 2: Initial Deployment

1. Set environment variables in Vercel (use localhost values for now, except DATABASE_URI)
2. Update `DATABASE_URI` to your MongoDB Atlas connection string
3. Deploy: `pnpm vercel --prod` or push to `main` branch
4. Note your Vercel deployment URL (e.g., `https://fealty-api.vercel.app`)

### Step 3: Update Production URLs

After first deployment, update these in Vercel Dashboard → Environment Variables → Production:

- `PAYLOAD_SERVER_URL` → `https://fealty-api.vercel.app` (your actual Vercel URL)
- `PAYLOAD_PUBLIC_SERVER_URL` → `https://fealty-api.vercel.app`
- `PAYLOAD_PUBLIC_CORS_CSRF_URLS` → `https://fealty-api.vercel.app` (for admin panel access)
- `PAYLOAD_PUBLIC_FRONTEND_URL` → `https://fealty-api.vercel.app` (or leave as is)
- `CRON_SECRET` → Generate secure random string

### Step 4: React Native App Configuration

In your React Native app (in the `fealty` directory), configure the API endpoint:

```typescript
// Example: src/config/api.ts
export const API_URL = __DEV__ 
  ? 'http://localhost:4000'  // Development - connects to local Payload API
  : 'https://fealty-api.vercel.app'  // Production - your Vercel deployment URL
```

**Note**: 
- Your React Native app connects directly to the API (port 4000 in dev, Vercel URL in production)
- No web server (port 3000) is needed - that's only for web frontends
- The admin panel is accessed via browser at `https://fealty-api.vercel.app/admin`

### Step 5: Redeploy

After updating environment variables, trigger a new deployment:
- Push a new commit to `main`, or
- Run `pnpm vercel --prod`

