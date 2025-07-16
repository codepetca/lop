import type * as Party from 'partykit/server';
import {
	Poll,
	VoteMessage,
	PollUpdateMessage,
	CreatePollRequest,
	PollSchema
} from './types';

/**
 * Handle vote messages from WebSocket clients
 */
export async function handleVote(
	room: Party.Room,
	poll: Poll,
	message: VoteMessage
): Promise<Poll | null> {
	// Check if the option exists in the poll
	if (!poll.options.includes(message.option)) {
		console.warn(`Invalid vote option: ${message.option}`);
		return null;
	}

	// Increment the vote count
	poll.votes[message.option] = (poll.votes[message.option] || 0) + 1;

	// Save updated poll to storage
	await room.storage.put('poll', poll);

	// Broadcast updated poll to all connected clients
	const updateMessage: PollUpdateMessage = {
		type: 'poll-update',
		poll: poll
	};
	room.broadcast(JSON.stringify(updateMessage));

	return poll;
}

/**
 * Handle poll creation requests
 */
export async function handleCreatePoll(
	room: Party.Room,
	request: CreatePollRequest
): Promise<Poll> {
	const title = request.title || 'Anonymous poll';
	const options = request.options || [];

	// Validate options
	if (options.length < 2) {
		throw new Error('At least 2 options required');
	}

	// Create new poll
	const poll: Poll = {
		id: room.id,
		title: title,
		options: options,
		votes: {}
	};

	// Initialize votes for each option
	options.forEach((option) => {
		poll.votes[option] = 0;
	});

	// Validate the created poll
	const validatedPoll = PollSchema.parse(poll);

	// Save to storage
	await room.storage.put('poll', validatedPoll);

	return validatedPoll;
}

/**
 * Handle GET poll requests
 */
export function handleGetPoll(poll: Poll | null): Response {
	if (poll) {
		return new Response(JSON.stringify(poll), {
			headers: { 'Content-Type': 'application/json' }
		});
	} else {
		return new Response('Not found', { status: 404 });
	}
}