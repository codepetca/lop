/**
 * Avatar utilities for DiceBear integration
 *
 * Provides functions for generating random avatar configurations,
 * building DiceBear URLs, and managing avatar state.
 */

export interface AvatarConfig {
	style: string;
	seed: string;
	backgroundColor?: string;
	backgroundType?: string;
}

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
	'icons',
	'identicon',
	'initials',
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
const BACKGROUND_COLORS = [
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
 * Generate a random avatar configuration based on a seed
 */
export function generateRandomAvatar(seed: string): AvatarConfig {
	// Use seed to generate consistent randomness
	const hash = simpleHash(seed);

	const styleIndex = hash % AVATAR_STYLES.length;
	const colorIndex = (hash >> 8) % BACKGROUND_COLORS.length;

	return {
		style: AVATAR_STYLES[styleIndex],
		seed: seed,
		backgroundColor: BACKGROUND_COLORS[colorIndex],
		backgroundType: 'solid'
	};
}

/**
 * Build DiceBear URL from avatar configuration
 */
export function buildAvatarUrl(config: AvatarConfig, size: number = 64): string {
	const baseUrl = 'https://api.dicebear.com/7.x';
	const params = new URLSearchParams({
		seed: config.seed,
		size: size.toString()
	});

	if (config.backgroundColor) {
		params.set('backgroundColor', config.backgroundColor);
	}

	if (config.backgroundType) {
		params.set('backgroundType', config.backgroundType);
	}

	return `${baseUrl}/${config.style}/svg?${params.toString()}`;
}

/**
 * Generate avatar configuration from player ID (deterministic)
 */
export function generateAvatarFromPlayerId(playerId: string): AvatarConfig {
	return generateRandomAvatar(playerId);
}

/**
 * Simple hash function for consistent randomness
 */
function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

/**
 * Get a preview URL for an avatar style with a sample seed
 */
export function getStylePreviewUrl(style: AvatarStyle, size: number = 64): string {
	return buildAvatarUrl(
		{
			style,
			seed: 'preview',
			backgroundColor: 'f0f0f0',
			backgroundType: 'solid'
		},
		size
	);
}

/**
 * Generate a new random avatar with a different seed
 */
export function generateNewRandomAvatar(): AvatarConfig {
	const randomSeed = Math.random().toString(36).substring(2, 15);
	return generateRandomAvatar(randomSeed);
}
