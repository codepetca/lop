import { z } from 'zod';

/**
 * Player Schema System
 *
 * This file defines the hierarchy of player schemas used across the application:
 * - BasePlayerSchema: Core player properties shared by all player types
 * - PollPlayerSchema: Poll-specific player extension
 * - GamePlayerSchema: Game-specific player extension (for story games)
 */

// Avatar configuration schema for DiceBear avatars
export const AvatarConfigSchema = z.object({
	/** DiceBear style name */
	style: z.string(),
	/** Seed for avatar generation */
	seed: z.string(),
	/** Background color (hex without #) */
	backgroundColor: z.string().optional(),
	/** Background type */
	backgroundType: z.string().optional()
});

// Base player schema - core properties shared by all player types
export const BasePlayerSchema = z.object({
	/** Unique UUID identifier for the player */
	id: z.string().uuid(),
	/** Display name chosen by or generated for the player */
	name: z.string().min(1).max(50),
	/** ISO timestamp when the player joined */
	joinedAt: z.string(),
	/** Avatar configuration for DiceBear */
	avatar: AvatarConfigSchema
});

/**
 * Poll Player Schema
 * Represents a player participating in a poll - uses just the base properties
 */
export const PollPlayerSchema = BasePlayerSchema;

/**
 * Game Player Schema (formerly CharacterStateSchema)
 * Represents a player in a story game with additional state tracking
 */
export const GamePlayerSchema = BasePlayerSchema.extend({
	/** Player stats like health, coins, etc. */
	stats: z.record(z.string(), z.number()).default({}),
	/** Items in player's inventory */
	inventory: z.array(z.string()).default([]),
	/** History of choice IDs the player has made */
	choices: z.array(z.string()).default([]),
	/** Current scene ID the player is in */
	currentScene: z.string()
});

// Export TypeScript types inferred from schemas
export type AvatarConfig = z.infer<typeof AvatarConfigSchema>;
export type BasePlayer = z.infer<typeof BasePlayerSchema>;
export type PollPlayer = z.infer<typeof PollPlayerSchema>;
export type GamePlayer = z.infer<typeof GamePlayerSchema>;

// Legacy type alias for backward compatibility
export type CharacterState = GamePlayer;
export const CharacterStateSchema = GamePlayerSchema;
