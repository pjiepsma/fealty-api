# Vercel Deployment Guide

This guide covers deploying the Fealty API to Vercel, based on best practices from the [Payload Website Starter template](https://vercel.com/templates/next.js/payload-website-starter).

## Prerequisites

- Vercel account
- MongoDB Atlas account (or another MongoDB hosting service)
- Resend account (already configured)

## Required Environment Variables

Set these in your Vercel project settings:

### Payload Configuration
```env
PAYLOAD_SECRET=your-long-random-secret-here
PAYLOAD_SERVER_URL=https://your-app.vercel.app
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/fealty
```

### Email Configuration (Resend)
```env
RESEND_API_KEY=re_V4fvqrg2_6wUzxHbCGgdE2WrCJmLdzGWz
RESEND_FROM_EMAIL=noreply@deelbaar.com
RESEND_FROM_NAME=Fealty
```

### CORS/CSRF Configuration
```env
PAYLOAD_PUBLIC_CORS_CSRF_URLS=https://your-frontend-domain.com,https://your-app.vercel.app
```

### Cron Jobs
```env
CRON_SECRET=your-long-random-secret-for-cron-authentication
ENABLE_PAYLOAD_AUTORUN=true
```

## MongoDB Setup

1. Create a MongoDB Atlas cluster (free tier available)
2. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/fealty`
3. Add it as `DATABASE_URL` in Vercel environment variables
4. Whitelist Vercel IPs (or use `0.0.0.0/0` for development - restrict in production)

## Storage (Optional)

If you need file storage for media uploads, consider:

- **Vercel Blob Storage** - Integrated with Vercel, easy setup
- **AWS S3** - More control, requires additional setup
- **Cloudinary** - Image optimization built-in

For Vercel Blob:
1. Add Vercel Blob Storage in your Vercel project
2. Add `BLOB_READ_WRITE_TOKEN` to environment variables
3. Configure Payload to use blob storage adapter

## Cron Jobs Configuration

The project uses Payload's built-in job scheduler for:
- Daily challenge assignment (00:00 UTC)
- Weekly challenge assignment (Monday 00:00 UTC)
- Monthly challenge assignment (1st of month 00:00 UTC)
- Challenge expiration (01:00 UTC daily)
- Daily decay (00:00 UTC)

### Vercel Cron Setup

1. **vercel.json** is already configured with a cron route
2. Set `CRON_SECRET` in Vercel environment variables
3. Vercel will call `/api/cron` once per day (Hobby plan limitation), which triggers Payload's job processor

**Hobby Plan Limitations:**
- Maximum 2 cron jobs per account
- Cron jobs can only run once per day
- Timing is not guaranteed (can trigger anywhere within the scheduled hour)
- Current schedule: `0 0 * * *` (daily at midnight UTC)

**For more frequent execution:**
- Upgrade to Pro plan for unlimited cron invocations
- Or use an external cron service (cron-job.org, EasyCron, etc.) to call `/api/cron` more frequently

### Alternative: External Cron Service

If you need more frequent cron execution, use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [UptimeRobot](https://uptimerobot.com)

Configure them to call: `https://your-app.vercel.app/api/cron` with header:
```
Authorization: Bearer YOUR_CRON_SECRET
```

## Deployment Steps

1. **Connect Repository**
   - Push your code to GitHub/GitLab/Bitbucket
   - Import project in Vercel dashboard

2. **Configure Environment Variables**
   - Add all required environment variables in Vercel project settings
   - Set them for Production, Preview, and Development environments

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `pnpm build` (or `npm run build`)
   - Output Directory: `.next`
   - Install Command: `pnpm install` (or `npm install`)

4. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Check build logs for any issues

## Post-Deployment

1. **Create Admin User**
   - Visit `https://your-app.vercel.app/admin`
   - Create your first admin user

2. **Verify Cron Jobs**
   - Check Vercel function logs for cron execution
   - Monitor Payload admin panel for job execution

3. **Test API Endpoints**
   - Verify GraphQL endpoint: `https://your-app.vercel.app/api/graphql`
   - Test REST API: `https://your-app.vercel.app/api/[collection]`

## Important Notes

### MongoDB Connection
- Use MongoDB Atlas connection string format: `mongodb+srv://...`
- Ensure network access allows Vercel IPs
- Use connection pooling for better performance

### Serverless Limitations
- Cold starts may occur on first request
- Function timeout: 10s (Hobby), 60s (Pro)
- Consider using Vercel Pro for better performance

### Jobs & Cron
- Payload jobs run in the same serverless function
- For heavy jobs, consider using a separate worker
- Monitor function execution time and memory usage

### Environment Variables
- Never commit secrets to git
- Use Vercel's environment variable management
- Different values for Production/Preview/Development

## Troubleshooting

### Build Failures
- Check Node.js version (should be 18.20.2+ or 20.9.0+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Database Connection Issues
- Verify MongoDB connection string format
- Check network access settings in MongoDB Atlas
- Ensure DATABASE_URL is set correctly

### Cron Jobs Not Running
- Verify CRON_SECRET is set
- Check Vercel cron configuration in dashboard
- Review function logs for errors
- Ensure ENABLE_PAYLOAD_AUTORUN=true

### Email Not Sending
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for API usage
- Verify domain is verified in Resend
- Check function logs for email errors

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Resend Documentation](https://resend.com/docs)

