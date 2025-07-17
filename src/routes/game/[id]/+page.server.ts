import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { GameSession } from '$lib/types';
import { env } from '$env/dynamic/private';
import { GetGameResponseSchema } from '$shared/schemas/index';

// Get PartyKit URL from environment or use default for development
function getPartyKitUrl(): string {
	return env.PARTYKIT_URL || 'http://127.0.0.1:1999';
}

export const load: PageServerLoad = async ({ params, fetch }) => {
	const gameId = params.id;
	const partyKitUrl = getPartyKitUrl();

	try {
		const response = await fetch(`${partyKitUrl}/parties/game/${gameId}`);

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Game not found');
			}
			throw error(500, 'Failed to load game');
		}

		const rawData = await response.json();
		const validatedData = GetGameResponseSchema.parse(rawData);

		if (!validatedData.game) {
			throw error(404, 'Game not found');
		}

		return {
			game: validatedData.game,
			gameId
		};
	} catch (err) {
		if (err instanceof Response) {
			throw err;
		}
		throw error(500, 'Failed to load game');
	}
};