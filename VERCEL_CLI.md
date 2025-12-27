# Vercel CLI Guide

The Vercel CLI allows you to manage your Vercel deployments, environment variables, and projects from the command line.

## Installation

Vercel CLI is installed as a dev dependency. Use it via:

```bash
pnpm vercel <command>
# or
npx vercel <command>
```

## Authentication

First, log in to your Vercel account:

```bash
pnpm vercel login
```

This will open a browser to authenticate with your Vercel account.

## Common Commands

### Link Project to Vercel

Link your local project to an existing Vercel project:

```bash
pnpm vercel link
```

This will:
- Ask you to select a Vercel account/team
- Ask you to select an existing project or create a new one
- Create a `.vercel` directory with project configuration

### Deploy to Preview

Deploy to a preview environment (not production):

```bash
pnpm vercel
# or
pnpm run vercel
```

This creates a preview deployment with a unique URL.

### Deploy to Production

Deploy to production (main branch):

```bash
pnpm vercel --prod
# or
pnpm run vercel:deploy
```

### View Deployments

List all deployments:

```bash
pnpm vercel ls
```

### View Project Info

Get information about the linked project:

```bash
pnpm vercel inspect
```

### Environment Variables

#### List Environment Variables

```bash
pnpm vercel env ls
# or
pnpm run vercel:env
```

#### Add Environment Variable

```bash
pnpm vercel env add <name>
```

This will prompt you to:
- Enter the value
- Select environments (Production, Preview, Development)

#### Remove Environment Variable

```bash
pnpm vercel env rm <name>
```

#### Pull Environment Variables

Download environment variables from Vercel to a `.env.local` file:

```bash
pnpm vercel env pull .env.local
```

### View Logs

View deployment logs:

```bash
pnpm vercel logs <deployment-url>
```

### Remove Deployment

Remove a deployment:

```bash
pnpm vercel rm <deployment-url>
```

### Domains

#### List Domains

```bash
pnpm vercel domains ls
```

#### Add Domain

```bash
pnpm vercel domains add <domain>
```

### Project Settings

#### View Project Settings

```bash
pnpm vercel project ls
```

#### Inspect Project

```bash
pnpm vercel inspect
```

## Workflow Examples

### Initial Setup

1. **Login:**
   ```bash
   pnpm vercel login
   ```

2. **Link Project:**
   ```bash
   pnpm vercel link
   ```

3. **Add Environment Variables:**
   ```bash
   pnpm vercel env add PAYLOAD_SECRET
   pnpm vercel env add DATABASE_URL
   # ... add all required variables
   ```

4. **Deploy:**
   ```bash
   pnpm vercel --prod
   ```

### Daily Development

1. **Pull latest environment variables:**
   ```bash
   pnpm vercel env pull .env.local
   ```

2. **Deploy preview:**
   ```bash
   pnpm vercel
   ```

3. **When ready, deploy to production:**
   ```bash
   pnpm vercel --prod
   ```

## Useful Scripts

The following scripts are available in `package.json`:

- `pnpm run vercel` - Open Vercel CLI
- `pnpm run vercel:deploy` - Deploy to production
- `pnpm run vercel:env` - List environment variables

## Documentation

For more information, see:
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel CLI Reference](https://vercel.com/docs/cli/commands)

