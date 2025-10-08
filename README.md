# Topic Claims

A real-time web application for students to claim unique presentation topics on a first-come, first-served basis. Built with Next.js, Convex, and shadcn/ui.

## Features

- **Real-time synchronization** - All selections update instantly across all connected clients
- **Atomic topic claiming** - No duplicate selections, guaranteed
- **No authentication required** - Admin access via secure tokens in URLs
- **Multiple views**:
  - Landing page for entering poll codes
  - Student selection page with live updates
  - Read-only results board for classroom projection
  - Admin panel for creating and managing polls

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex (real-time database with automatic sync)
- **Hosting**: Vercel (frontend) + Convex (backend)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Convex account (free at [convex.dev](https://convex.dev))

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Convex**:
   ```bash
   npx convex dev
   ```

   This will:
   - Prompt you to log in to Convex (or create an account)
   - Create a new Convex project
   - Generate a `.env.local` file with your Convex URL
   - Start the Convex dev server

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Instructors (Admins)

1. Go to `/admin` or click "Create New Poll" from the landing page
2. Enter:
   - Poll title (e.g., "Research Topic Selection")
   - Description (optional)
   - List of topics (one per line)
3. Click "Create Poll"
4. You'll receive three links:
   - **Student Share URL** - Share this with students
   - **Admin Manage URL** - Keep this private! Use it to manage the poll
   - **Results URL** - Display this on a projector to show real-time selections

**Important**: Admin URLs are saved to your browser's localStorage. If you close the window, you can return to `/admin` to see your recent polls and access their admin panels. However, if you clear your browser data or use a different browser, you'll lose access.

### For Students

1. Go to the Student Share URL provided by your instructor
2. Enter your first name, last name, and optional group members
3. Click "Continue"
4. Select a topic from the list
5. You can change your selection at any time while the poll is open

### Admin Management

From the Admin Manage page, you can:
- **Toggle poll open/closed** - Stop accepting new selections
- **Add more topics** - Add topics to the poll after creation
- **Copy share links** - Easily share URLs with students
- **Export results** - Download a CSV of all selections
- **Monitor progress** - See which topics are claimed in real-time

### Results View

The results page (`/r/[pollId]`) is designed for classroom projection:
- Large, easy-to-read display
- Automatically updates in real-time
- Shows claimed topics with student names
- Shows unclaimed topics separately
- Dark theme for better projection

## Project Structure

```
lop/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── p/[pollId]/page.tsx        # Student selection page
│   ├── r/[pollId]/page.tsx        # Results board
│   ├── admin/
│   │   ├── page.tsx               # Create poll page
│   │   └── [pollId]/page.tsx      # Admin manage page
│   ├── layout.tsx
│   ├── globals.css
│   └── ConvexClientProvider.tsx
├── convex/
│   ├── schema.ts                  # Database schema
│   ├── polls.ts                   # Poll queries & mutations
│   ├── topics.ts                  # Topic queries
│   ├── groups.ts                  # Group queries & mutations
│   └── selections.ts              # Selection mutations
├── components/ui/                 # shadcn/ui components
└── lib/
    └── utils.ts                   # Utility functions
```

## Data Model

### Polls
- `title`: Poll title
- `description`: Optional description
- `isOpen`: Whether the poll accepts selections
- `adminToken`: Secret token for admin access
- `createdAt`: Timestamp

### Topics
- `pollId`: Reference to poll
- `label`: Topic name
- `selectedByGroupId`: Group that claimed this topic (optional)
- `selectedAt`: Timestamp of selection (optional)

### Groups
- `pollId`: Reference to poll
- `leaderFirst`: First name of group leader
- `leaderLast`: Last name of group leader
- `members`: Array of additional group member names
- `createdAt`: Timestamp

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will automatically detect Next.js and configure build settings
4. Add your Convex environment variables:
   - `CONVEX_DEPLOYMENT` (from `.env.local`)
   - `NEXT_PUBLIC_CONVEX_URL` (from `.env.local`)

### Deploy Convex Backend

```bash
npx convex deploy
```

This will deploy your Convex functions and schema to production. Update your Vercel environment variables with the production Convex URL.

## Development Notes

### Atomic Selections

The `selections.claim` mutation ensures no duplicate selections:
1. Validates poll is open
2. Unassigns any previous selection by this group
3. Checks target topic is available
4. Atomically claims the topic or throws an error

This all happens in a single transaction, preventing race conditions.

### Real-time Updates

Convex provides automatic real-time synchronization via `useQuery`. Any changes to polls, topics, or selections are instantly reflected in all connected clients.

## Future Enhancements

Ideas for future development:
- QR code generation for easy URL sharing
- Scheduled poll closing
- Duplicate name detection
- Topic reordering and soft deletion
- Per-topic notes/descriptions
- Export to more formats (PDF, Excel)
- Email notifications when topics are claimed
- Student authentication via LTI or OAuth

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
