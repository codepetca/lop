import type * as Party from 'partykit/server';
import {
	Poll,
	PollUpdateMessage,
	MessageSchema,
	CreatePollRequestSchema
} from './types';
import {
	handleVote,
	handleCreatePoll,
	handleGetPoll
} from './handlers';

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
				const data = await req.json();
				const validatedData = CreatePollRequestSchema.parse(data);

				const poll = await handleCreatePoll(this.room, validatedData);
				this.poll = poll;

				return new Response(JSON.stringify(poll), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				console.error('Error creating poll:', error);
				if (error instanceof Error && error.message === 'At least 2 options required') {
					return new Response(error.message, { status: 400 });
				}
				return new Response('Bad Request', { status: 400 });
			}
		}

		if (req.method === 'GET') {
			return handleGetPoll(this.poll);
		}

		return new Response('Method not allowed', { status: 405 });
	}

}

PollServer satisfies Party.Worker;
