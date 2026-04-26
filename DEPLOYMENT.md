# Deployment Guide

## Cloud Deployment (MongoDB Atlas + Railway + Vercel)

### Quick 4-Step Setup

**Step 1: MongoDB Atlas** (https://www.mongodb.com/cloud/atlas)
- Sign up → New cluster (M0 Free)
- Create a database user with a simple password (avoid special characters)
- Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/?appName=yourApp`
- Network Access: Allow `0.0.0.0/0`

**Step 2: Railway Backend** (https://railway.app)
- Sign up with GitHub
- New Project → Deploy from GitHub repo → select your repo
- After import, go to service **Settings → Source → Root Directory**: set to `backend`
- Go to **Variables** tab and add:
  - `NODE_ENV=production`
  - `MONGODB_URI=<your Atlas connection string>`
  - `JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">`
  - `JWT_EXPIRE=7d`
  - `ADMIN_CODE=<your private admin registration code>`
  - `FRONTEND_URL=https://placeholder.vercel.app` (update in Step 4)
- Go to **Settings → Networking** → click **Generate Domain**
- Copy your Railway URL (e.g. `https://your-service.up.railway.app`)

**Step 3: Vercel Frontend** (https://vercel.com)
- Sign up with GitHub
- New Project → Import your repo
- Set **Root Directory** to `frontend`
- Add environment variable: `VITE_API_URL=<your Railway URL>/api`
- Deploy → copy your Vercel domain (e.g. `https://your-app.vercel.app`)

**Step 4: Final CORS Update**
- Return to Railway → **Variables** tab
- Update `FRONTEND_URL` to your actual Vercel URL (e.g. `https://your-app.vercel.app`)
- Railway redeploys automatically

### Test It
1. Open your Vercel URL
2. Register a new account
3. Create an event
4. Verify data appears in MongoDB Atlas dashboard

---

## Local Development

```bash
npm run install-all   # Install all dependencies
npm run dev           # Start both frontend and backend
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

See `ENV_REFERENCE.md` for all environment variable details.

---

## Troubleshooting

### Frontend Can't Connect to Backend
- Confirm `VITE_API_URL` in Vercel points to your Railway URL with `/api` at the end
- Confirm `FRONTEND_URL` in Railway matches your Vercel domain exactly

### MongoDB Connection Error
- Check `MONGODB_URI` is correct in Railway Variables
- Confirm Atlas Network Access allows `0.0.0.0/0`

### Authentication Issues
- Verify `JWT_SECRET` is set in Railway Variables
- Clear browser local storage and try again
