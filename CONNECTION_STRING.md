# Your MongoDB Atlas Connection String

## Your Credentials
- Username: `pieteriepsma_db_user`
- Password: `IDf5bTg4lK4qAbZT`
- Cluster: `fealty.ryyw23t.mongodb.net`
- Database: `fealty`

## Full Connection String

```
mongodb+srv://pieteriepsma_db_user:IDf5bTg4lK4qAbZT@fealty.ryyw23t.mongodb.net/fealty?retryWrites=true&w=majority
```

## What Changed

1. ✅ Replaced `<db_password>` with: `IDf5bTg4lK4qAbZT`
2. ✅ Added database name `/fealty` before the `?`
3. ✅ Changed query params to standard MongoDB options: `?retryWrites=true&w=majority`

## Next Step: Update Vercel

Copy the connection string above and update it in Vercel:

1. Go to: https://vercel.com/[your-team]/fealty-api/settings/environment-variables
2. Find `DATABASE_URI`
3. Click **Edit**
4. Paste the full connection string
5. Make sure it's for **Production** environment
6. Click **Save**

## Or via CLI

```powershell
# Remove old value
pnpm vercel env rm DATABASE_URI production

# Add new value (paste the connection string when prompted)
pnpm vercel env add DATABASE_URI production
```

## After Updating

Trigger a new deployment:
```bash
git commit --allow-empty -m "Update DATABASE_URI to MongoDB Atlas"
git push
```

Or redeploy from Vercel dashboard.



