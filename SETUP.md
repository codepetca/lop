# Setup Instructions

Follow these steps to get the app running locally:

## 1. Install Dependencies

```bash
npm install
```

## 2. Initialize Convex

**Important**: You must run this step before building or running the app!

```bash
npx convex dev
```

This command will:
1. Prompt you to log in to Convex (create a free account if needed)
2. Ask you to create a new Convex project
3. Generate a `.env.local` file with your Convex deployment URL
4. Create the `convex/_generated` folder with TypeScript types
5. Push your schema and functions to Convex
6. Start watching for changes

**Keep this terminal window open** - it needs to stay running during development.

## 3. Run the Development Server

In a **new terminal window**, start Next.js:

```bash
npm run dev
```

## 4. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see the landing page!

## Common Issues

### "Module not found: @/convex/_generated/api"

**Solution**: You need to run `npx convex dev` first to generate the Convex types.

### "NEXT_PUBLIC_CONVEX_URL is not defined"

**Solution**: Make sure `npx convex dev` completed successfully and created a `.env.local` file.

### Build errors on first try

**Solution**: This is normal! The build will fail until you've run `npx convex dev` to generate the required files.

## Quick Start (All Commands)

```bash
# Terminal 1
npm install
npx convex dev

# Terminal 2 (open after convex dev is running)
npm run dev
```

## Testing the App

1. Go to http://localhost:3000
2. Click "Create New Poll"
3. Fill out the form with:
   - Title: "Test Poll"
   - Topics: Add a few test topics (one per line)
4. Click "Create Poll"
5. Copy the "Student Share URL"
6. Open it in a new tab/window
7. Enter your name and select a topic
8. Open the "Results URL" in another tab to see real-time updates!

## Next Steps

- Read the [README.md](./README.md) for full documentation
- Customize the styling in `app/globals.css`
- Modify the schema in `convex/schema.ts` (Convex will auto-update)
- Deploy to Vercel when ready
