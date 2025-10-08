# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Web-based Class Polling App** - A real-time presentation topic selection system where students claim unique topics on a first-come, first-served basis. No authentication; admin access via secret tokens in URLs.

## Technology Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Convex (real-time database with atomic mutations)
- **Hosting:** Vercel (frontend) + Convex (backend)

## Data Model (Convex)

### Tables
- **`polls`**: `{ _id, title, description?, isOpen, adminToken, createdAt }`
- **`topics`**: `{ _id, pollId, label, selectedByGroupId?, selectedAt? }`
  - Indexes: `by_poll`, `by_poll_label`
- **`groups`**: `{ _id, pollId, leaderFirst, leaderLast, members: string[], createdAt }`
  - Index: `by_poll`
- **`picks`** (optional audit log): `{ _id, pollId, groupId, topicId, action: 'select'|'unselect', at }`

## Page Routes

- **`/`**: Landing page - enter poll code or use shared link
- **`/p/[pollId]`**: Student page - enter name, select topic, see live updates
- **`/r/[pollId]`**: Read-only results board (projector-friendly)
- **`/admin`**: Create new poll, get shareable links
- **`/admin/[pollId]?token=ADMIN_TOKEN`**: Manage poll (toggle isOpen, add topics, export CSV)

## Critical Concurrency Pattern

Topic claims MUST be atomic to prevent duplicate selections:

1. Validate `poll.isOpen`
2. If group has previous pick, unassign it first
3. Load target topic; if `selectedByGroupId` is set and belongs to another group → **throw error**
4. Set `selectedByGroupId = groupId` and `selectedAt = now`

All state-changing admin mutations must validate `adminToken` parameter.

## Business Rules

- Each group selects exactly ONE topic at a time
- Topics are exclusive - only one group can claim each topic
- Selecting a new topic automatically releases the previous selection
- Groups consist of: leader first/last name + optional comma-separated members
- Poll must be `isOpen` for students to make selections
