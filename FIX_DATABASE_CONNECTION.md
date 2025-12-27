# 🔴 URGENT: Fix MongoDB Connection Error

## Problem

Your Vercel deployment is trying to connect to `127.0.0.1:27017` (localhost), which doesn't exist in serverless environments.

**Error**: `connect ECONNREFUSED 127.0.0.1:27017`

## Solution: Set Up MongoDB Atlas

You need to use MongoDB Atlas (cloud MongoDB) instead of localhost.

### Step 1: Create MongoDB Atlas Account & Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account (M0 Free Tier is fine)
3. Create a new cluster (choose AWS/MongoDB region closest to you)
4. Wait for cluster to deploy (2-3 minutes)

### Step 2: Create Database User

1. In Atlas dashboard, go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Enter username and password (save these!)
5. Set privileges to **Read and write to any database**
6. Click **Add User**

### Step 3: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   - ⚠️ This is less secure but easier for serverless
   - For production, consider restricting to Vercel IPs later
4. Click **Confirm**

### Step 4: Get Connection String

1. Go back to **Database** (left sidebar)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your actual credentials
6. Add database name at the end (e.g., `fealty`):
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/fealty?retryWrites=true&w=majority
   ```

### Step 5: Update Vercel Environment Variable

1. Go to Vercel Dashboard: https://vercel.com/[your-team]/fealty-api/settings/environment-variables
2. Find `DATABASE_URI` in the list
3. Click **Edit**
4. **Replace** `mongodb://127.0.0.1:27017/payload` with your Atlas connection string
5. Make sure it's set for **Production** environment
6. Click **Save**

**Or via CLI:**
```powershell
# You'll be prompted to enter the value
pnpm vercel env rm DATABASE_URI production
pnpm vercel env add DATABASE_URI production
# Paste your MongoDB Atlas connection string when prompted
```

### Step 6: Redeploy

After updating the environment variable:

1. **Option A**: Push a new commit
   ```bash
   git commit --allow-empty -m "Trigger redeploy with new DATABASE_URI"
   git push
   ```

2. **Option B**: Redeploy from Vercel dashboard
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment
   - Click **Redeploy**

3. **Option C**: Use Vercel CLI
   ```powershell
   pnpm vercel --prod
   ```

## Verify It Works

After redeployment, check the logs:
1. Go to Vercel Dashboard → **Deployments** → Click latest deployment
2. Check **Functions** logs
3. You should see successful MongoDB connection (no more `ECONNREFUSED` errors)

## Example Connection String Format

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fealty?retryWrites=true&w=majority
```

**Important parts:**
- `username:password` - Your Atlas database user credentials
- `cluster0.xxxxx.mongodb.net` - Your cluster address
- `/fealty` - Database name (can be anything)
- `?retryWrites=true&w=majority` - Connection options (keep these)

## Troubleshooting

### Still getting connection errors?

1. **Check credentials** - Make sure username/password in connection string are correct
2. **Check network access** - Ensure `0.0.0.0/0` is allowed in Atlas Network Access
3. **Check connection string format** - Make sure it starts with `mongodb+srv://`
4. **Wait a few minutes** - Atlas changes can take 1-2 minutes to propagate

### Security Note

Allowing `0.0.0.0/0` (all IPs) is convenient but less secure. For production:
- Consider restricting to Vercel IP ranges
- Use strong database passwords
- Regularly rotate credentials
- Monitor Atlas dashboard for suspicious activity



