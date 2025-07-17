import { fail } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { CreatePollResponseSchema } from '$shared/schemas/index';

// Fallback to default development URL if not set
const PARTYKIT_URL = env.PARTYKIT_URL || 'http://127.0.0.1:1999';

export const actions: Actions = {
	createPoll: async ({ request }) => {
		console.log(`Creating server-generated poll via lobby`);
		console.log(`PartyKit URL: ${PARTYKIT_URL}`);

		// Create poll through the lobby server (same room as WebSocket connection)
		const response = await fetch(`${PARTYKIT_URL}/parties/main/main/create-poll`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({})
		});

		console.log(`Response status: ${response.status}`);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`PartyKit error: ${errorText}`);
			return fail(500, {
				error: 'Failed to create poll. Please try again.'
			});
		}

		try {
			// Validate the response data
			const rawData = await response.json();
			const validatedData = CreatePollResponseSchema.parse(rawData);

			if (!validatedData.success || !validatedData.poll) {
				console.error(`Poll creation failed: ${validatedData.error}`);
				return fail(500, {
					error: 'Failed to create poll. Please try again.'
				});
			}

			console.log(`Poll created with ID: ${validatedData.poll.id}`);

			// Return the poll ID to display in the frontend
			return {
				pollId: validatedData.poll.id
			};
		} catch (error) {
			console.error('Error validating poll creation response:', error);
			return fail(500, {
				error: 'Failed to create poll. Please try again.'
			});
		}
	}
};
