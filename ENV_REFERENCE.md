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

# CORS (comma-separated URLs)
CORS_ORIGINS=https://staffing-app.vercel.app,https://localhost:3000
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
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

**Frontend:** (no .env needed, uses proxy in vite.config.ts)

---

## How to Generate JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6...`

Use that long string as your `JWT_SECRET`.

---

## Railway Environment Variables UI

1. Go to Railway dashboard
2. Select your project (backend)
3. Click "Variables" tab
4. Paste each variable pair
5. Click "Deploy" to apply changes
