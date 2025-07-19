/**
 * Shared avatar constants used by both frontend and backend
 */

import type { AvatarConfig } from '../schemas/player';

// Available DiceBear styles
export const AVATAR_STYLES = [
	'adventurer',
	'adventurer-neutral',
	'avataaars',
	'big-ears',
	'big-ears-neutral',
	'big-smile',
	'bottts',
	'bottts-neutral',
	'croodles',
	'croodles-neutral',
	'fun-emoji',
	'identicon',
	'lorelei',
	'lorelei-neutral',
	'micah',
	'miniavs',
	'open-peeps',
	'personas',
	'pixel-art',
	'pixel-art-neutral',
	'shapes',
	'thumbs'
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

// Background colors for avatars
export const BACKGROUND_COLORS = [
	'b6e3f4', // light blue
	'c2f0c2', // light green
	'ffd3a5', // light orange
	'fd9cc8', // light pink
	'd1c4e9', // light purple
	'fff9c4', // light yellow
	'ffcdd2', // light red
	'f3e5ab', // light beige
	'e1f5fe', // very light blue
	'f1f8e9' // very light green
];

/**
 * Simple hash function for consistent randomness
 */
export function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

/**
 * Generate a deterministic avatar configuration based on a player ID
 */
export function generateAvatarFromPlayerId(playerId: string): AvatarConfig {
	const hash = simpleHash(playerId);

	const styleIndex = hash % AVATAR_STYLES.length;
	const colorIndex = (hash >> 8) % BACKGROUND_COLORS.length;

	return {
		style: AVATAR_STYLES[styleIndex],
		seed: playerId,
		backgroundColor: BACKGROUND_COLORS[colorIndex],
		backgroundType: 'solid'
	};
}
