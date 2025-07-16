import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Fallback to default development URL if not set
const PARTYKIT_URL = env.PARTYKIT_URL || 'http://127.0.0.1:1999';

export const actions: Actions = {
	createPoll: async ({ request }) => {
		// Generate a random poll ID
		const pollId = Math.random().toString(36).substr(2, 9);

		console.log(`Creating server-generated poll with ID: ${pollId}`);
		console.log(`PartyKit URL: ${PARTYKIT_URL}`);

		// Create server-generated poll on PartyKit server
		const response = await fetch(`${PARTYKIT_URL}/parties/main/${pollId}`, {
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

		// Return the poll ID to display in the frontend
		return {
			pollId: pollId
		};
	}
};
