import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { Poll } from '$lib/types';
import { env } from '$env/dynamic/private';
import { GetPollResponseSchema } from '$shared/schemas/index';

// Get PartyKit URL from environment or use default for development
function getPartyKitUrl(): string {
	return env.PARTYKIT_URL || 'http://127.0.0.1:1999';
}

export const load: PageServerLoad = async ({ params, fetch }) => {
	const pollId = params.poll_id;
	const partyKitUrl = getPartyKitUrl();

	try {
		const response = await fetch(`${partyKitUrl}/parties/poll/${pollId}`);

		if (!response.ok) {
			if (response.status === 404) {
				throw error(404, 'Poll not found');
			}
			throw error(500, 'Failed to load poll');
		}

		const rawData = await response.json();
		const validatedData = GetPollResponseSchema.parse(rawData);

		if (!validatedData.poll) {
			throw error(404, 'Poll not found');
		}

		return {
			poll: validatedData.poll,
			pollId
		};
	} catch (err) {
		if (err instanceof Response) {
			throw err;
		}
		throw error(500, 'Failed to load poll');
	}
};
