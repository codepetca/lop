import type * as Party from 'partykit/server';
import { Poll, PollUpdateMessage, MessageSchema } from './types';
import { handleVote, handleCreatePollServerGenerated, handleGetPoll } from './handlers';

export default class PollServer implements Party.Server {
	constructor(readonly room: Party.Room) {}

	// Store poll data in memory
	poll: Poll | null = null;

	// Load poll data from storage when the room starts
	async onStart() {
		const storedPoll = await this.room.storage.get<Poll>('poll');
		if (storedPoll) {
			this.poll = storedPoll;
		}
	}

	// Handle new WebSocket connections
	async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
		// Send current poll data to new connections
		if (this.poll) {
			conn.send(
				JSON.stringify({
					type: 'poll-update',
					poll: this.poll
				} as PollUpdateMessage)
			);
		}
	}

	// Handle incoming WebSocket messages
	async onMessage(message: string, sender: Party.Connection) {
		try {
			const data = JSON.parse(message);
			const validatedMessage = MessageSchema.parse(data);

			if (validatedMessage.type === 'vote' && this.poll) {
				const updatedPoll = await handleVote(this.room, this.poll, validatedMessage);
				if (updatedPoll) {
					this.poll = updatedPoll;
				}
			}
		} catch (error) {
			console.error('Error processing message:', error);
		}
	}

	// Handle HTTP requests (for creating polls)
	async onRequest(req: Party.Request): Promise<Response> {
		const url = new URL(req.url);

		if (req.method === 'POST') {
			try {
				// Check if poll data is provided in the request body
				const body = await req.text();
				if (body) {
					// Poll data provided by lobby
					const pollData = JSON.parse(body) as Poll;
					this.poll = pollData;
					await this.room.storage.put('poll', this.poll);
				} else {
					// Create server-generated poll
					const poll = await handleCreatePollServerGenerated(this.room);
					this.poll = poll;
				}

				return new Response(JSON.stringify(this.poll), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				console.error('Error creating poll:', error);
				return new Response('Failed to create poll', { status: 500 });
			}
		}

		if (req.method === 'GET') {
			// Auto-create poll if it doesn't exist (for polls created by lobby)
			if (!this.poll) {
				const poll = await handleCreatePollServerGenerated(this.room);
				this.poll = poll;
			}
			return handleGetPoll(this.poll);
		}

		return new Response('Method not allowed', { status: 405 });
	}
}

PollServer satisfies Party.Worker;
