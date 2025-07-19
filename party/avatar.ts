/**
 * Avatar utilities for backend - generates DiceBear avatar configurations
 *
 * Backend version of the frontend avatar utilities
 */

import type { AvatarConfig } from '$shared/schemas/player';
import { AVATAR_STYLES, BACKGROUND_COLORS, simpleHash } from '$shared/constants/avatar';

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
