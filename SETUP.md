# Quick Setup Guide

## ✅ **Completed Setup Steps**

The following have been completed and are ready:
- ✅ Backend dependencies installed 
- ✅ Frontend dependencies installed
- ✅ TypeScript compilation verified
- ✅ Basic .env files created
- ✅ Backend server tested (runs on port 2567)

## 🚀 **Ready to Start Development**

### Start the Backend Server
```bash
cd backend
npm run dev
```
Server will start on http://localhost:2567

### Start the Frontend Server
```bash
cd frontend
npm run dev
```
Frontend will start on http://localhost:5173

## 📋 **Next Steps for Full Functionality**

### 1. Database Setup (Required for game to work)
1. Create a [Neon PostgreSQL](https://neon.tech) database
2. Copy your connection string
3. Update `backend/.env` with your DATABASE_URL
4. Run the SQL from `database-setup.sql` in your database

### 2. Environment Variables
Update the `.env` files with your actual values:

**Backend (.env)**:
```env
DATABASE_URL=your-neon-database-url-here
LUCIA_SECRET=any-random-secret-key
```

**Frontend (.env)** (defaults should work for local development):
```env
VITE_COLYSEUS_URL=ws://localhost:2567
VITE_API_URL=http://localhost:2567
```

## 🎮 **Testing the Game**

1. Start both servers (backend and frontend)
2. Open http://localhost:5173 in multiple browser tabs
3. Enter different player names and select the "Forest Quest" campaign
4. Join the same game and test the voting mechanics

## 🔧 **Development Commands**

**Backend**:
- `npm run dev` - Development server with auto-reload
- `npm run build` - Build for production
- `npm run start` - Start production build

**Frontend**:
- `npm run dev` - Development server
- `npm run build` - Build for production
- `npm run check` - TypeScript checking
- `npm run lint` - ESLint checking

## 🚨 **Important Notes**

- The game requires a PostgreSQL database to function
- Sample data is included in `database-setup.sql`
- Without database setup, the frontend will show "No campaigns available"
- Both servers must be running for full functionality