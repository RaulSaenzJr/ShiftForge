# Deployment Guide

## ⭐ RECOMMENDED: Cloud Deployment (Railway + Vercel + MongoDB Atlas)

Deploy to production in ~30 minutes. Free tier covers 1 small app.

### Quick 4-Step Setup

**Step 1: MongoDB Atlas** (https://www.mongodb.com/cloud/atlas)
- Sign up → New cluster (M0 Free)
- Get connection string: `mongodb+srv://user:pass@...`
- Network Access: Allow 0.0.0.0/0

**Step 2: Railway Backend** (https://railway.app)
- Sign up with GitHub
- Import StaffingAPP repo → select backend folder
- Add env vars:
  - `NODE_ENV=production`
  - `MONGODB_URI=<from Atlas>`
  - `JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - `CORS_ORIGINS=https://placeholder.vercel.app` (update later)
- Deploy → copy your Railway URL (e.g., `https://staffing-api.up.railway.app`)

**Step 3: Vercel Frontend** (https://vercel.com)
- Sign up with GitHub
- Import StaffingAPP repo
- Root directory: `./frontend`
- Add env var: `VITE_API_URL=<your Railway URL>/api`
- Deploy → get your Vercel domain (e.g., `https://staffing-app.vercel.app`)

**Step 4: Final CORS Update**
- Return to Railway backend settings
- Update `CORS_ORIGINS=https://staffing-app.vercel.app` (your actual Vercel URL)
- Redeploy backend

### Test It
1. Open your Vercel URL
2. Register a new account
3. Create an event
4. Verify data in MongoDB Atlas dashboard

**Cost:** Free tier for 1 month, then ~$5-10/mo

---

## Prerequisites (Docker Option)

- Docker and Docker Compose installed
- MongoDB (can use Docker container)
- Node.js 18+ (for local development)

## Quick Start with Docker

1.**Clone and navigate to the project:**

```bash
cd StaffingAPP
```

2.**Configure environment variables:**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret
```

3.**Deploy with Docker Compose:**

```bash
chmod +x deploy.sh
./deploy.sh
```

The application will be available at:

- Frontend: <http://localhost>

- Backend API: <http://localhost:5000>

- MongoDB: mongodb://localhost:27017

## Manual Deployment

### Backend

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file with:

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d
NODE_ENV=production
```

4. Start the server:

```bash
npm start
```

### Frontend

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Build for production:

```bash
npm run build
```

4. Serve with a web server (nginx, Apache, etc.)

## Development

Run both frontend and backend in development mode:

```bash
npm run install-all  # Install all dependencies
npm run dev         # Start both servers
```

- Frontend dev server: <http://localhost:3000>
- Backend dev server: <http://localhost:5000>

## Environment Variables

### Backend (.env)

- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens (use a strong random string)
- `JWT_EXPIRE`: Token expiration time (e.g., "7d", "24h")
- `NODE_ENV`: Environment (development/production)

## Database Setup

The application uses MongoDB. On first run:

1. Create admin user through registration
2. Create contractor users
3. Contractors should select their available roles during registration

## User Roles

### Admin

- Create and manage events
- View calendar
- Review and approve/reject applications
- See all staffing requests

### Contractor

- View available events
- Apply for shifts
- View application status
- See approved shifts

## Staff Roles Available

- Server
- Bartender
- Busser
- Dishwasher
- Food Runner
- Chef
- Kitchen Assistant
- Set up/Break down
- Equipment Drivers

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# View running containers
docker-compose ps
```

## Production Deployment

For production deployment:

1. Use a proper MongoDB Atlas or hosted database
2. Set a strong JWT_SECRET
3. Configure proper CORS settings
4. Use HTTPS/SSL certificates
5. Set up proper logging and monitoring
6. Configure backup strategies for MongoDB

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity

### Frontend Can't Connect to Backend

- Check backend is running on correct port
- Verify CORS settings
- Check proxy configuration in vite.config.ts

### Authentication Issues

- Verify JWT_SECRET is set
- Check token expiration settings
- Clear browser local storage
