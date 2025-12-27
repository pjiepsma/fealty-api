# PowerShell script to add environment variables to Vercel
# Run: .\setup-vercel-env.ps1

Write-Host "Setting up environment variables for Vercel..." -ForegroundColor Green
Write-Host "Note: You'll need to enter values when prompted" -ForegroundColor Yellow
Write-Host ""

# Node setup
# Note: TZ is a reserved system variable and cannot be set in Vercel
# Timezone is handled by Vercel's server settings

# Payload setup
Write-Host "Adding PAYLOAD_SECRET..." -ForegroundColor Cyan
echo "d51387b19ec73a5cdb49a91e" | pnpm vercel env add PAYLOAD_SECRET production
echo "d51387b19ec73a5cdb49a91e" | pnpm vercel env add PAYLOAD_SECRET preview
echo "d51387b19ec73a5cdb49a91e" | pnpm vercel env add PAYLOAD_SECRET development

Write-Host "Adding DATABASE_URI..." -ForegroundColor Cyan
Write-Host "NOTE: For production, use MongoDB Atlas connection string (not localhost)" -ForegroundColor Yellow
echo "mongodb://127.0.0.1:27017/payload" | pnpm vercel env add DATABASE_URI production
echo "mongodb://127.0.0.1:27017/payload" | pnpm vercel env add DATABASE_URI preview
echo "mongodb://127.0.0.1:27017/payload" | pnpm vercel env add DATABASE_URI development

Write-Host "Adding PAYLOAD_SERVER_URL..." -ForegroundColor Cyan
Write-Host "NOTE: For production, this will be your Vercel deployment URL" -ForegroundColor Yellow
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_SERVER_URL production
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_SERVER_URL preview
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_SERVER_URL development

Write-Host "Adding PAYLOAD_SERVER_PORT..." -ForegroundColor Cyan
echo "4000" | pnpm vercel env add PAYLOAD_SERVER_PORT production
echo "4000" | pnpm vercel env add PAYLOAD_SERVER_PORT preview
echo "4000" | pnpm vercel env add PAYLOAD_SERVER_PORT development

Write-Host "Adding PAYLOAD_PUBLIC_CORS_CSRF_URLS..." -ForegroundColor Cyan
Write-Host "NOTE: For React Native - only needed for admin panel access" -ForegroundColor Yellow
echo "http://localhost:4000,exp://localhost:8081" | pnpm vercel env add PAYLOAD_PUBLIC_CORS_CSRF_URLS production
echo "http://localhost:4000,exp://localhost:8081" | pnpm vercel env add PAYLOAD_PUBLIC_CORS_CSRF_URLS preview
echo "http://localhost:4000,exp://localhost:8081" | pnpm vercel env add PAYLOAD_PUBLIC_CORS_CSRF_URLS development

Write-Host "Adding PAYLOAD_PUBLIC_FRONTEND_URL..." -ForegroundColor Cyan
Write-Host "NOTE: Not used by React Native app, only for admin panel" -ForegroundColor Yellow
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_PUBLIC_FRONTEND_URL production
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_PUBLIC_FRONTEND_URL preview
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_PUBLIC_FRONTEND_URL development

Write-Host "Adding PAYLOAD_PUBLIC_SERVER_URL..." -ForegroundColor Cyan
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_PUBLIC_SERVER_URL production
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_PUBLIC_SERVER_URL preview
echo "http://localhost:4000" | pnpm vercel env add PAYLOAD_PUBLIC_SERVER_URL development

# Email setup
Write-Host "Adding MAIL_ADAPTER..." -ForegroundColor Cyan
echo "resend" | pnpm vercel env add MAIL_ADAPTER production
echo "resend" | pnpm vercel env add MAIL_ADAPTER preview
echo "resend" | pnpm vercel env add MAIL_ADAPTER development

Write-Host "Adding MAIL_API_KEY..." -ForegroundColor Cyan
echo "re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz" | pnpm vercel env add MAIL_API_KEY production
echo "re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz" | pnpm vercel env add MAIL_API_KEY preview
echo "re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz" | pnpm vercel env add MAIL_API_KEY development

Write-Host "Adding EMAIL_FROM_ADDRESS..." -ForegroundColor Cyan
echo "noreply@deelbaar.com" | pnpm vercel env add EMAIL_FROM_ADDRESS production
echo "noreply@deelbaar.com" | pnpm vercel env add EMAIL_FROM_ADDRESS preview
echo "noreply@deelbaar.com" | pnpm vercel env add EMAIL_FROM_ADDRESS development

Write-Host "Adding EMAIL_FROM_NAME..." -ForegroundColor Cyan
echo "Fealty" | pnpm vercel env add EMAIL_FROM_NAME production
echo "Fealty" | pnpm vercel env add EMAIL_FROM_NAME preview
echo "Fealty" | pnpm vercel env add EMAIL_FROM_NAME development

# Alternative email variable names (for compatibility)
Write-Host "Adding RESEND_API_KEY..." -ForegroundColor Cyan
echo "re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz" | pnpm vercel env add RESEND_API_KEY production
echo "re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz" | pnpm vercel env add RESEND_API_KEY preview
echo "re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz" | pnpm vercel env add RESEND_API_KEY development

Write-Host "Adding RESEND_FROM_EMAIL..." -ForegroundColor Cyan
echo "noreply@deelbaar.com" | pnpm vercel env add RESEND_FROM_EMAIL production
echo "noreply@deelbaar.com" | pnpm vercel env add RESEND_FROM_EMAIL preview
echo "noreply@deelbaar.com" | pnpm vercel env add RESEND_FROM_EMAIL development

Write-Host "Adding RESEND_FROM_NAME..." -ForegroundColor Cyan
echo "Fealty" | pnpm vercel env add RESEND_FROM_NAME production
echo "Fealty" | pnpm vercel env add RESEND_FROM_NAME preview
echo "Fealty" | pnpm vercel env add RESEND_FROM_NAME development

# Jobs
Write-Host "Adding ENABLE_PAYLOAD_AUTORUN..." -ForegroundColor Cyan
echo "true" | pnpm vercel env add ENABLE_PAYLOAD_AUTORUN production
echo "true" | pnpm vercel env add ENABLE_PAYLOAD_AUTORUN preview
echo "true" | pnpm vercel env add ENABLE_PAYLOAD_AUTORUN development

Write-Host "Adding CRON_SECRET..." -ForegroundColor Cyan
Write-Host "NOTE: Generate a secure random string for production" -ForegroundColor Yellow
echo "your-cron-secret-here" | pnpm vercel env add CRON_SECRET production
echo "your-cron-secret-here" | pnpm vercel env add CRON_SECRET preview
echo "your-cron-secret-here" | pnpm vercel env add CRON_SECRET development

Write-Host ""
Write-Host "✅ Environment variables setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Update these values for production:" -ForegroundColor Yellow
Write-Host "  - DATABASE_URI: Use MongoDB Atlas connection string" -ForegroundColor Yellow
Write-Host "  - PAYLOAD_SERVER_URL: Use your Vercel deployment URL" -ForegroundColor Yellow
Write-Host "  - PAYLOAD_PUBLIC_CORS_CSRF_URLS: Use production frontend URLs" -ForegroundColor Yellow
Write-Host "  - PAYLOAD_PUBLIC_FRONTEND_URL: Use production frontend URL" -ForegroundColor Yellow
Write-Host "  - PAYLOAD_PUBLIC_SERVER_URL: Use production server URL" -ForegroundColor Yellow
Write-Host "  - CRON_SECRET: Generate a secure random string" -ForegroundColor Yellow

