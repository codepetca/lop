/**
 * Centralized configuration for PartyKit environment variables
 * Eliminates duplication and ensures consistent fallback values
 */

export interface PartyKitConfig {
	/** PartyKit host URL for internal API requests */
	host: string;
	/** PartyKit URL for external requests */
	url: string;
	/** WebSocket host for client connections */
	wsHost: string;
}

/**
 * Get PartyKit configuration with consistent fallback values
 * Uses environment variables with sensible defaults for development
 * In development, PartyKit may use a random port, so we detect it
 */
export function getPartyKitConfig(): PartyKitConfig {
	// Check if we're in development and PartyKit has set a port
	const actualPort = process.env.PARTYKIT_PORT || process.env.PORT;
	const defaultHost = actualPort ? `http://127.0.0.1:${actualPort}` : 'http://127.0.0.1:1999';
	const defaultWsHost = actualPort ? `127.0.0.1:${actualPort}` : '127.0.0.1:1999';

	return {
		host: process.env.PARTYKIT_HOST || defaultHost,
		url: process.env.PARTYKIT_URL || defaultHost,
		wsHost: process.env.PUBLIC_PARTYKIT_HOST || defaultWsHost
	};
}

/**
 * Get lobby URL for room registration
 */
export function getLobbyUrl(endpoint: string = ''): string {
	const config = getPartyKitConfig();
	return `${config.host}${endpoint}`;
}
