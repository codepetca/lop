/**
 * Shared name generator constants and functions
 * Creates fun, single-word combinations using adjective + noun
 */

export const adjectives = [
	'Swift',
	'Bright',
	'Clever',
	'Bold',
	'Quick',
	'Wise',
	'Calm',
	'Sharp',
	'Brave',
	'Gentle',
	'Fierce',
	'Noble',
	'Strong',
	'Silent',
	'Mighty',
	'Glowing',
	'Hidden',
	'Dancing',
	'Soaring',
	'Blazing',
	'Crystal',
	'Golden',
	'Silver',
	'Starlit',
	'Mystic',
	'Shadow',
	'Thunder',
	'Lightning',
	'Crimson',
	'Azure',
	'Emerald',
	'Cosmic',
	'Wild',
	'Free',
	'Ancient',
	'Radiant'
];

export const nouns = [
	'Panda',
	'Wolf',
	'Eagle',
	'Tiger',
	'Fox',
	'Bear',
	'Lion',
	'Hawk',
	'Dragon',
	'Phoenix',
	'Falcon',
	'Raven',
	'Owl',
	'Lynx',
	'Jaguar',
	'Moon',
	'Star',
	'Sun',
	'Storm',
	'Wind',
	'Fire',
	'Ocean',
	'Mountain',
	'River',
	'Forest',
	'Crystal',
	'Flame',
	'Arrow',
	'Blade',
	'Shield',
	'Crown',
	'Gem',
	'Pearl',
	'Comet',
	'Nova',
	'Quest',
	'Spirit'
];

/**
 * Generate a random player name combining adjective + noun
 * Returns names like "SwiftPanda", "BrightMoon", etc.
 */
export function generatePlayerName(): string {
	const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	return `${adjective}${noun}`;
}

/**
 * Check if a name appears to be auto-generated (follows our pattern)
 * Useful for determining if a user has customized their name
 */
export function isGeneratedName(name: string): boolean {
	// Check if name matches adjective + noun pattern (no spaces, title case)
	const parts = name.match(/^([A-Z][a-z]+)([A-Z][a-z]+)$/);
	if (!parts) return false;

	const [, adjective, noun] = parts;
	return adjectives.includes(adjective) && nouns.includes(noun);
}
