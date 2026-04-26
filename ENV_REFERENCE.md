# Environment Variables Reference

## Backend (.env)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/staffing?retryWrites=true&w=majority

# Security
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_EXPIRE=7d
ADMIN_CODE=<your-private-admin-registration-code>

# CORS — set to your Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app
```

## Frontend (.env.production)

```env
VITE_API_URL=https://your-railway-backend.up.railway.app/api
```

## Local Development (.env)

**Backend:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/staffing-app
JWT_SECRET=dev-secret-key-not-for-production
JWT_EXPIRE=7d
ADMIN_CODE=<your-local-admin-code>
FRONTEND_URL=http://localhost:5173
```

**Frontend:** (no .env needed, uses proxy in vite.config.ts)

---

## How to Generate JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output: `a1b2c3d4e5f6...` — use that long string as your `JWT_SECRET`.

---

## Railway Environment Variables

1. Go to Railway dashboard
2. Select your backend service
3. Click the **Variables** tab
4. Add each variable
5. Railway redeploys automatically on save
