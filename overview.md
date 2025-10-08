# Web-based Class Polling App (Next.js + Convex)

## 1) Goal
A simple, real-time web app for students to claim a unique presentation topic (no repeats). Admins create a “poll” with a list of topics; students enter their names and pick exactly one topic. Choices are exclusive (first-come, first-served) and can be unpicked to switch.

## 2) Roles
- **Admin:** Creates a new poll, pastes line-separated options, gets shareable links, can lock/unlock and export results.
- **Student/Group:** Enters first/last names (plus optional group members), selects exactly one topic; can unselect to pick another if available.

## 3) Architecture
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- **Backend/DB:** Convex for data, real-time sync, and atomic mutations.
- **Hosting:** Vercel (frontend) + Convex (backend). No user auth; admin gated by secret token in URL.

## 4) Core Pages & Flows
- **`/`**: Landing → enter poll code or open shared link.
- **`/p/[pollId]`**: Student page to enter names and select a topic. Live updates; claimed topics show the claimant.
- **`/r/[pollId]`**: Read-only results board for projecting in class (large, responsive grid).
- **`/admin`**: Create poll (title, description, paste topics one per line). Returns:
  - **Admin Manage URL**: `/admin/[pollId]?token=ADMIN_TOKEN`
  - **Student Share URL**: `/p/[pollId]`
  - **Results URL**: `/r/[pollId]`
- **`/admin/[pollId]`**: Manage poll (toggle accepting picks, add topics, copy share links, export CSV).

## 5) Data Model (Convex)
- **`polls`**: `{ _id, title, description?, isOpen, adminToken, createdAt }`
- **`topics`**: `{ _id, pollId, label, selectedByGroupId?, selectedAt? }`
- **`groups`**: `{ _id, pollId, leaderFirst, leaderLast, members: string[], createdAt }`
- **`picks`** (optional audit): `{ _id, pollId, groupId, topicId, action: 'select'|'unselect', at }`

> MVP can skip `picks` and store selection on `topics`.

## 6) Concurrency & No-Repeat Guarantee
Perform topic claim in a **single atomic mutation**:
1. Validate `poll.isOpen`.
2. If the group has a previous pick, unassign it.
3. Load target `topic`; if `selectedByGroupId` is set and not this group → **throw**.
4. Set `selectedByGroupId = groupId` and `selectedAt = now`.

Unselect: set `selectedByGroupId = null`.  
Use optimistic UI, but the server mutation is source of truth.

## 7) Admin Links (No Auth)
- Generated on create:
  - **Admin URL:** `/admin/[pollId]?token=ADMIN_TOKEN`
  - **Student URL:** `/p/[pollId]`
  - **Results URL:** `/r/[pollId]`
- Mutations that change state require `adminToken` in args and validate it.

## 8) Validation & UX
- Required: first name, last name. Optional: group members (comma-separated → array).
- Exactly one active selection per group; choosing another topic frees the previous one.
- Disabled “Claim” for taken topics; tooltip shows “Taken by {First Last}”.
- Results page: projector-friendly grid; auto-updates via Convex live queries.

## 9) Nice-to-Haves (Post-MVP)
- CSV export of roster & picks
- QR code buttons for share links
- Lock poll at a scheduled time
- Duplicate-name detection
- Soft delete/reorder topics
- Per-topic notes

## 10) Convex Schema (Starter)
```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  polls: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    isOpen: v.boolean(),
    adminToken: v.string(),
    createdAt: v.number(), // Date.now()
  }),
  topics: defineTable({
    pollId: v.id("polls"),
    label: v.string(),
    selectedByGroupId: v.optional(v.id("groups")),
    selectedAt: v.optional(v.number()),
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_label", ["pollId", "label"]),
  groups: defineTable({
    pollId: v.id("polls"),
    leaderFirst: v.string(),
    leaderLast: v.string(),
    members: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_poll", ["pollId"]),
});