# Database Setup Guide

This guide covers setting up the PostgreSQL database for the multiplayer choose-your-own-adventure game.

## Prerequisites

- PostgreSQL database (recommended: [Neon](https://neon.tech) for hosted PostgreSQL)
- Node.js and npm installed

## Quick Setup

1. **Create your database**
   - For Neon: Create a new project at [neon.tech](https://neon.tech)
   - Copy your connection string

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your DATABASE_URL
   ```

3. **Run migrations**
   ```bash
   npm run db:setup
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/database

# Example for Neon:
# DATABASE_URL=postgresql://username:password@ep-xyz123.us-east-2.aws.neon.tech/neondb?sslmode=require

# Backend Configuration
PORT=2567
NODE_ENV=development

# Frontend Configuration
VITE_COLYSEUS_URL=ws://localhost:2567
VITE_API_URL=http://localhost:2567

# Auth Configuration
SESSION_SECRET=your-session-secret-here-change-in-production
```

## Database Schema

The database includes the following tables:

### Core Game Tables
- **campaigns**: Game campaigns/adventures
- **scenes**: Individual scenes within campaigns
- **scene_targets**: Clickable areas within scenes

### Authentication Tables
- **users**: User accounts (including guest users)
- **sessions**: Active user sessions

## Migration Commands

```bash
# Run all pending migrations
npm run db:migrate

# Reset database (WARNING: destroys all data)
npm run db:reset

# Setup database (runs migrations + seeds sample data)
npm run db:setup
```

## Sample Data

The migration system includes sample data for development:

- **Forest Quest**: A simple 3-scene adventure
  - Forest Entrance → Dark Path OR Victory
  - Dark Path → Victory
  - Victory (final scene)

## Production Deployment

For production deployments:

1. Set `NODE_ENV=production`
2. Use a secure `SESSION_SECRET`
3. Ensure your `DATABASE_URL` uses SSL
4. Run migrations before starting the application

## Troubleshooting

### Connection Issues
- Verify your `DATABASE_URL` is correct
- For Neon, ensure you're using the connection string with `?sslmode=require`
- Check that your database server is running

### Migration Failures
- Ensure the database exists
- Check that you have proper permissions
- Review the migration logs for specific errors

### Reset Everything
If you need to start fresh:
```bash
# Drop all tables and recreate
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:setup
```