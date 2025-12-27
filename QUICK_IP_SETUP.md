# Quick IP Address Setup

## Where to Add IP Address

1. **In the left sidebar**, look for **"Security"** section
2. Click on **"Network Access"** (or "Database Access" → "Network Access")
3. You should see a page with your current IP address already listed
4. Click the green **"Add IP Address"** button
5. Choose **"Allow Access from Anywhere"** or enter `0.0.0.0/0`
6. Click **"Confirm"**

## Navigation Path

```
Atlas Dashboard
└── Security (left sidebar)
    └── Network Access
        └── Add IP Address button
            └── Enter: 0.0.0/0
                └── Confirm
```

## Alternative Path

If you don't see "Network Access" under Security:
1. Look for **"Database Access"** in the left sidebar
2. Click it
3. You should see a tab or link for **"Network Access"**
4. Click that tab/link
5. Then click **"Add IP Address"**

## What You Should See

After clicking "Network Access", you should see:
- A list of IP addresses (probably just your current IP: `62.250.5.67`)
- A green button: **"Add IP Address"** or **"Add IP Entry"**
- A table showing allowed IPs

## What to Enter

When prompted for IP address:
- Enter: `0.0.0.0/0`
- Or select: **"Allow Access from Anywhere"** (if available)
- Add a comment (optional): "Vercel serverless functions"
- Click **"Confirm"** or **"Add"**

⚠️ **Important**: This allows access from any IP address, which is necessary for Vercel's serverless functions that can come from anywhere.



