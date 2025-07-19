import type * as Party from 'partykit/server';
import {
	Poll,
	PollUpdateMessage,
	PlayerJoinedPollMessage,
	MessageSchema,
	GetPollResponseSchema,
	CreatePollResponseSchema
} from '../shared/schemas/index';
import {
	handleVote,
	handlePlayerJoinPoll,
	handleCreatePollServerGeneratedNoRegistration
} from './handlers';
import { PartyKitServer } from './lib/server';
import { useMessageHandler, useBroadcast, useStorage } from './lib/hooks';

type PollStorage = {
	poll: Poll;
};

export default class PollServer extends PartyKitServer {
	private poll: Poll | null = null;
	private storage = useStorage<PollStorage>(this.room);
	private broadcast = useBroadcast<PollUpdateMessage>(this.room);
	private messageHandler = useMessageHandler(MessageSchema, this.room);

	async setup() {
		// Load poll from storage
		this.poll = await this.storage.get('poll');

		// Set up message handlers
		this.messageHandler.handle('vote', async (message, sender) => {
			if (!this.poll) return;

			const updatedPoll = await handleVote(this.room, this.poll, message);
			if (updatedPoll) {
				this.poll = updatedPoll;
				await this.storage.set('poll', updatedPoll);
			}
		});

		this.messageHandler.handle('player-join-poll', async (message, sender) => {
			if (!this.poll) return;

			const result = await handlePlayerJoinPoll(this.room, this.poll, message);
			if (result.updatedPoll) {
				this.poll = result.updatedPoll;
				await this.storage.set('poll', result.updatedPoll);
			}
			if (result.error) {
				console.warn(`Player join failed: ${result.error}`);
			}
		});
	}

	async handleMessage(message: string, sender: Party.Connection) {
		await this.messageHandler.processMessage(message, sender);
	}

	async handleRequest(req: Party.Request): Promise<Response> {
		const url = new URL(req.url);

		if (req.method === 'POST') {
			try {
				// Create server-generated poll (without registration since lobby handles it)
				const poll = await handleCreatePollServerGeneratedNoRegistration(this.room);
				this.poll = poll;
				await this.storage.set('poll', poll);

				const response = CreatePollResponseSchema.parse({
					success: true,
					poll: poll
				});

				return this.http.success(response);
			} catch (error) {
				console.error('Error creating poll:', error);
				const errorResponse = CreatePollResponseSchema.parse({
					success: false,
					error: 'poll_creation_failed'
				});
				return this.http.error(errorResponse.error, 500);
			}
		}

		if (req.method === 'GET') {
			const response = GetPollResponseSchema.parse({
				poll: this.poll
			});
			return this.http.success(response);
		}

		return this.http.methodNotAllowed();
	}

	// Send current poll data to new connections
	protected async onConnectionOpen(conn: Party.Connection) {
		if (this.poll) {
			this.broadcast.send(conn, {
				type: 'poll-update',
				poll: this.poll
			});
		}
	}
}

PollServer satisfies Party.Worker;
