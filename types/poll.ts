/**
 * Shared types for poll-related data
 */

export interface SavedPoll {
  pollId: string;
  adminToken: string;
  title: string;
  createdAt: number;
}
