#!/bin/bash
# Script to add all required environment variables to Vercel
# Run: bash setup-vercel-env.sh

echo "Adding environment variables to Vercel..."
echo "You'll be prompted for each value."

# Payload Configuration
pnpm vercel env add PAYLOAD_SECRET production
pnpm vercel env add PAYLOAD_SECRET preview
pnpm vercel env add PAYLOAD_SECRET development

pnpm vercel env add PAYLOAD_SERVER_URL production
pnpm vercel env add PAYLOAD_SERVER_URL preview
pnpm vercel env add PAYLOAD_SERVER_URL development

pnpm vercel env add DATABASE_URL production
pnpm vercel env add DATABASE_URL preview
pnpm vercel env add DATABASE_URL development

# Email Configuration (Resend)
pnpm vercel env add RESEND_API_KEY production
pnpm vercel env add RESEND_API_KEY preview
pnpm vercel env add RESEND_API_KEY development

pnpm vercel env add RESEND_FROM_EMAIL production
pnpm vercel env add RESEND_FROM_EMAIL preview
pnpm vercel env add RESEND_FROM_EMAIL development

pnpm vercel env add RESEND_FROM_NAME production
pnpm vercel env add RESEND_FROM_NAME preview
pnpm vercel env add RESEND_FROM_NAME development

# CORS/CSRF Configuration
pnpm vercel env add PAYLOAD_PUBLIC_CORS_CSRF_URLS production
pnpm vercel env add PAYLOAD_PUBLIC_CORS_CSRF_URLS preview
pnpm vercel env add PAYLOAD_PUBLIC_CORS_CSRF_URLS development

# Cron Jobs
pnpm vercel env add CRON_SECRET production
pnpm vercel env add CRON_SECRET preview
pnpm vercel env add CRON_SECRET development

pnpm vercel env add ENABLE_PAYLOAD_AUTORUN production
pnpm vercel env add ENABLE_PAYLOAD_AUTORUN preview
pnpm vercel env add ENABLE_PAYLOAD_AUTORUN development

echo "Done! All environment variables added."







