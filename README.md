# Staffing Application

Event staffing management system with calendar, shift management, and approval workflow.

## Features

- User authentication (Admin, Contractor)
- Interactive calendar view
- Event creation and management
- Staff roles: Server, Bartender, Busser, Dishwasher, Food Runner, Chef, Kitchen Assistant, Set up/Break down, Equipment Drivers
- Contractor shift application system
- Admin approval workflow

## Setup

1. Install dependencies:
```bash
npm run install-all
```

2. Configure environment variables:
   - Create `backend/.env` file with MongoDB connection string and JWT secret

3. Run development servers:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + MongoDB
- Authentication: JWT
