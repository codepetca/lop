import type * as Party from 'partykit/server';
import { Poll, VoteMessage, PollUpdateMessage, PollSchema } from './types';
import { getRandomQuestion } from './questions';
import { initializePollVotes } from './utils';

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
 * Handle server-generated poll creation
 */
export async function handleCreatePollServerGenerated(room: Party.Room): Promise<Poll> {
	// Get a random question from the bank
	const question = getRandomQuestion();

	// Create new poll with server-generated content
	const poll: Poll = {
		id: room.id,
		title: question.title,
		options: question.options,
		votes: initializePollVotes(question.options)
	};

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
