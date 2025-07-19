/**
 * Avatar utilities for DiceBear integration
 *
 * Provides functions for generating random avatar configurations,
 * building DiceBear URLs, and managing avatar state.
 */

import type { AvatarConfig } from '$shared/schemas/player';
import {
	AVATAR_STYLES,
	BACKGROUND_COLORS,
	simpleHash,
	type AvatarStyle
} from '$shared/constants/avatar';

export type { AvatarConfig, AvatarStyle };
export { AVATAR_STYLES };

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
