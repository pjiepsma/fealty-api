# MongoDB Atlas Setup Steps

## Your Credentials
- Username: `pieteriepsma_db_user`
- Password: `IDf5bTg4lK4qAbZT`

## Step 1: Complete Connection Security Setup

### Add IP Address for Vercel

Since Vercel uses serverless functions that can come from any IP address, you need to allow access from anywhere:

1. In the MongoDB Atlas setup screen, under "Add a connection IP address"
2. Click "Add a Different IP Address"
3. Enter: `0.0.0.0/0` (allows all IPs - required for Vercel serverless)
4. Click "Add IP Address"
5. Click "Finish and Close"

⚠️ **Note**: `0.0.0.0/0` is less secure but necessary for Vercel. You can restrict IPs later if needed.

## Step 2: Get Connection String

After completing setup:

1. Go to your MongoDB Atlas dashboard
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Replace** `<username>` and `<password>` with your credentials:
   ```
   mongodb+srv://pieteriepsma_db_user:IDf5bTg4lK4qAbZT@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

7. **Add database name** (e.g., `fealty`) before the `?`:
   ```
   mongodb+srv://pieteriepsma_db_user:IDf5bTg4lK4qAbZT@cluster0.xxxxx.mongodb.net/fealty?retryWrites=true&w=majority
   ```

## Step 3: Update Vercel Environment Variable

1. Go to: https://vercel.com/[your-team]/fealty-api/settings/environment-variables
2. Find `DATABASE_URI` in the list
3. Click **Edit**
4. **Replace** the value with your connection string (from Step 2)
5. Make sure it's set for **Production** environment
6. Click **Save**

**Or via CLI:**
```powershell
# Remove old value
pnpm vercel env rm DATABASE_URI production

# Add new value (you'll be prompted to paste it)
pnpm vercel env add DATABASE_URI production
# Paste your full connection string when prompted
```

## Step 4: Redeploy

After updating the environment variable, trigger a new deployment:

**Option A: Push empty commit**
```bash
git commit --allow-empty -m "Update DATABASE_URI to MongoDB Atlas"
git push
```

**Option B: Redeploy from Vercel dashboard**
- Go to Deployments → Latest deployment → ⋯ → Redeploy

**Option C: Use CLI**
```powershell
pnpm vercel --prod
```

## Verify It Works

1. Check Vercel deployment logs
2. Should see successful MongoDB connection (no more `ECONNREFUSED` errors)
3. Your API endpoints should work now!

## Example Final Connection String

```
mongodb+srv://pieteriepsma_db_user:IDf5bTg4lK4qAbZT@cluster0.xxxxx.mongodb.net/fealty?retryWrites=true&w=majority
```

Replace `cluster0.xxxxx.mongodb.net` with your actual cluster address from Atlas.



