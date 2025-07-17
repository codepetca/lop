import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

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

		// Get the poll data from the response
		const pollData = await response.json();
		console.log(`Poll created with ID: ${pollData.id}`);

		// Return the poll ID to display in the frontend
		return {
			pollId: pollData.id
		};
	}
};
