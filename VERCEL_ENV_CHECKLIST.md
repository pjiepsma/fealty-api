# Vercel Environment Variables Checklist

Use this checklist to verify all required environment variables are set in Vercel.

## Required Variables (Minimum)

### Core Payload
- [ ] `PAYLOAD_SECRET` - Secret key for Payload (required)
- [ ] `DATABASE_URI` or `DATABASE_URL` - MongoDB connection string (required)
- [ ] `PAYLOAD_SERVER_URL` - Your Vercel deployment URL (required for production)
- [ ] `PAYLOAD_PUBLIC_SERVER_URL` - Your Vercel deployment URL (used in email links)

### Email (Resend)
- [ ] `MAIL_ADAPTER=resend` - Email adapter type
- [ ] `RESEND_API_KEY` or `MAIL_API_KEY` - Resend API key (required)
- [ ] `RESEND_FROM_EMAIL` or `EMAIL_FROM_ADDRESS` - Fallback email (optional, Mail global takes precedence)
- [ ] `RESEND_FROM_NAME` or `EMAIL_FROM_NAME` - Fallback name (optional, Mail global takes precedence)

### Jobs & Cron
- [ ] `ENABLE_PAYLOAD_AUTORUN=true` - Enable Payload job scheduler
- [ ] `CRON_SECRET` - Secure random string for cron endpoint authentication

### Optional but Recommended
- [ ] `PAYLOAD_SERVER_PORT=4000` - Server port (optional)
- [ ] Note: `TZ` is a reserved system variable and cannot be set in Vercel
- [ ] `PAYLOAD_PUBLIC_CORS_CSRF_URLS` - CORS/CSRF URLs (defaults to '*' if not set)
- [ ] `PAYLOAD_PUBLIC_FRONTEND_URL` - Frontend URL (optional, not used by React Native)

## Quick Check

**Minimum required for production:**
1. `PAYLOAD_SECRET`
2. `DATABASE_URI` (MongoDB Atlas connection string)
3. `PAYLOAD_SERVER_URL` (your Vercel URL)
4. `PAYLOAD_PUBLIC_SERVER_URL` (your Vercel URL)
5. `MAIL_ADAPTER=resend`
6. `RESEND_API_KEY`
7. `ENABLE_PAYLOAD_AUTORUN=true`
8. `CRON_SECRET`

**Email variables are optional** since you can configure them in the Payload UI (Globals → Mail), but it's good to have them as fallbacks:
- `RESEND_FROM_EMAIL` (fallback)
- `RESEND_FROM_NAME` (fallback)

## Note on Alternative Variable Names

Some variables have alternative names that work:
- `RESEND_API_KEY` OR `MAIL_API_KEY` (either works)
- `RESEND_FROM_EMAIL` OR `EMAIL_FROM_ADDRESS` (either works)
- `RESEND_FROM_NAME` OR `EMAIL_FROM_NAME` (either works)
- `DATABASE_URI` OR `DATABASE_URL` (either works)

You don't need to set both - just pick one of each pair.

## Verify Your Setup

If you have 10 variables set, you likely have:
1. ✅ PAYLOAD_SECRET
2. ✅ DATABASE_URI
3. ✅ PAYLOAD_SERVER_URL
4. ✅ PAYLOAD_PUBLIC_SERVER_URL
5. ✅ MAIL_ADAPTER
6. ✅ RESEND_API_KEY
7. ✅ RESEND_FROM_EMAIL
8. ✅ RESEND_FROM_NAME
9. ✅ ENABLE_PAYLOAD_AUTORUN
10. ✅ CRON_SECRET

**You might be missing:**
- `TZ` (optional but recommended)
- `PAYLOAD_PUBLIC_CORS_CSRF_URLS` (optional, defaults to '*')

**You're good to go if you have at least the 8 minimum required variables!**

