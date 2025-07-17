import { fail } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { CreatePollResponseSchema, CreateGameResponseSchema, GetStoriesResponseSchema } from '$shared/schemas/index';

// Get PartyKit URL from environment or use default for development
function getPartyKitUrl(): string {
	return env.PARTYKIT_URL || 'http://127.0.0.1:1999';
}

// Load available stories for game creation
export async function load() {
	const partyKitUrl = getPartyKitUrl();
	
	try {
		const response = await fetch(`${partyKitUrl}/parties/main/main/stories`);
		if (response.ok) {
			const rawData = await response.json();
			const validatedData = GetStoriesResponseSchema.parse(rawData);
			return {
				stories: validatedData.stories
			};
		}
	} catch (error) {
		console.error('Error loading stories:', error);
	}
	
	return {
		stories: []
	};
}

export const actions: Actions = {
	createPoll: async ({ request }) => {
		const partyKitUrl = getPartyKitUrl();
		console.log(`Creating server-generated poll via lobby`);
		console.log(`PartyKit URL: ${partyKitUrl}`);

		// Create poll through the lobby server (same room as WebSocket connection)
		const response = await fetch(`${partyKitUrl}/parties/main/main/create-poll`, {
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
	},

	createGame: async ({ request }) => {
		const partyKitUrl = getPartyKitUrl();
		const formData = await request.formData();
		const storyId = formData.get('storyId') as string;
		const title = formData.get('title') as string;
		const maxPlayers = parseInt(formData.get('maxPlayers') as string) || 20;
		const requiresVoting = formData.get('requiresVoting') === 'on';

		if (!storyId) {
			return fail(400, {
				error: 'Please select a story template.'
			});
		}

		console.log(`Creating game with story: ${storyId}`);
		console.log(`PartyKit URL: ${partyKitUrl}`);

		// Create game through the lobby server
		const response = await fetch(`${partyKitUrl}/parties/main/main/create-game`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				storyId,
				title: title || undefined,
				maxPlayers,
				requiresVoting
			})
		});

		console.log(`Response status: ${response.status}`);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`PartyKit error: ${errorText}`);
			return fail(500, {
				error: 'Failed to create game. Please try again.'
			});
		}

		try {
			// Validate the response data
			const rawData = await response.json();
			const validatedData = CreateGameResponseSchema.parse(rawData);

			if (!validatedData.success || !validatedData.game) {
				console.error(`Game creation failed: ${validatedData.error}`);
				return fail(500, {
					error: 'Failed to create game. Please try again.'
				});
			}

			console.log(`Game created with ID: ${validatedData.game.id}`);

			// Return the game ID to display in the frontend
			return {
				gameId: validatedData.game.id,
				gameTitle: validatedData.game.title
			};
		} catch (error) {
			console.error('Error validating game creation response:', error);
			return fail(500, {
				error: 'Failed to create game. Please try again.'
			});
		}
	}
};
