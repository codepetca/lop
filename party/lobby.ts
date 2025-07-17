import type * as Party from 'partykit/server';
import {
	RoomMetadata,
	RoomListRequestMessage,
	RoomListMessage,
	MessageSchema,
	Poll,
	RegisterRoomRequestSchema,
	RegisterRoomResponseSchema,
	CreatePollResponseSchema,
	ApiErrorResponseSchema
} from '../shared/schemas/index.js';
import { PartyKitServer } from './lib/server';
import { useMessageHandler, useBroadcast, useStorage } from './lib/hooks';

type LobbyStorage = {
	roomRegistry: [string, RoomMetadata][];
};

export default class LobbyServer extends PartyKitServer {
	private roomRegistry: Map<string, RoomMetadata> = new Map();
	private storage = useStorage<LobbyStorage>(this.room);
	private broadcast = useBroadcast<RoomListMessage>(this.room);
	private messageHandler = useMessageHandler(MessageSchema, this.room);

	async setup() {
		// Load room registry from storage
		const storedRegistry = await this.storage.get('roomRegistry');
		if (storedRegistry) {
			this.roomRegistry = new Map(storedRegistry);
			console.log(`Loaded ${this.roomRegistry.size} rooms from storage`);
		}

		// Set up message handlers
		this.messageHandler.handle('room-list-request', async (message, sender) => {
			this.sendRoomList(sender);
		});
	}

	async handleMessage(message: string, sender: Party.Connection) {
		await this.messageHandler.processMessage(message, sender);
	}

	async handleRequest(req: Party.Request): Promise<Response> {
		const url = new URL(req.url);
		console.log(`Lobby received ${req.method} request to: ${url.pathname}`);

		// Room registration
		if (req.method === 'POST' && url.pathname.endsWith('/register')) {
			return this.handleRoomRegistration(req);
		}

		// Room unregistration
		if (req.method === 'DELETE' && url.pathname.includes('/unregister/')) {
			return this.handleRoomUnregistration(url);
		}

		// Poll creation
		if (req.method === 'POST' && url.pathname.endsWith('/create-poll')) {
			return this.handlePollCreation(req);
		}

		return this.http.methodNotAllowed();
	}

	protected async onConnectionOpen(conn: Party.Connection) {
		console.log('New connection to lobby:', conn.id);
		this.sendRoomList(conn);
	}

	// Private methods
	private sendRoomList(conn: Party.Connection) {
		const rooms = Array.from(this.roomRegistry.values());
		const message: RoomListMessage = {
			type: 'room-list',
			rooms: rooms
		};

		this.broadcast.send(conn, message);
	}

	private broadcastRoomList() {
		const rooms = Array.from(this.roomRegistry.values());
		const message: RoomListMessage = {
			type: 'room-list',
			rooms: rooms
		};

		this.broadcast.broadcast(message);
	}

	private async saveRegistry() {
		const registryArray = Array.from(this.roomRegistry.entries());
		await this.storage.set('roomRegistry', registryArray);
	}

	private async handleRoomRegistration(req: Party.Request): Promise<Response> {
		try {
			const requestData = await req.json();
			const roomData = RegisterRoomRequestSchema.parse(requestData);

			// Create room metadata
			const roomMetadata: RoomMetadata = {
				id: roomData.id,
				title: roomData.title,
				createdAt: new Date().toISOString(),
				activeConnections: 0,
				totalVotes: 0
			};

			// Add room to registry
			this.roomRegistry.set(roomData.id, roomMetadata);

			// Save registry to storage
			await this.saveRegistry();

			// Broadcast updated room list
			this.broadcastRoomList();

			console.log(`Registered room: ${roomData.id} - ${roomData.title}`);

			const response = RegisterRoomResponseSchema.parse({ success: true });
			return this.http.success(response);
		} catch (error) {
			console.error('Error registering room:', error);
			const errorResponse = ApiErrorResponseSchema.parse({
				error: 'registration_failed',
				message: 'Failed to register room'
			});
			return this.http.error('Failed to register room', 500);
		}
	}

	private async handleRoomUnregistration(url: URL): Promise<Response> {
		const roomId = url.pathname.split('/').pop();

		if (roomId && this.roomRegistry.has(roomId)) {
			this.roomRegistry.delete(roomId);

			// Save registry to storage
			await this.saveRegistry();

			this.broadcastRoomList();

			console.log(`Unregistered room: ${roomId}`);

			return this.http.success({ message: 'Room unregistered' });
		}

		return this.http.notFound('Room not found');
	}

	private async handlePollCreation(req: Party.Request): Promise<Response> {
		try {
			// Consume the request body
			await req.json().catch(() => ({}));

			// Generate a random poll ID
			const pollId = Math.random().toString(36).substr(2, 9);
			console.log(`Creating new poll with ID: ${pollId}`);

			// Use context.parties to create poll in poll server
			const pollParty = this.room.context.parties.poll;
			const pollRoom = pollParty.get(pollId);

			// Create the poll by making a POST request to the poll server
			const pollResponse = await pollRoom.fetch({
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({})
			});

			if (!pollResponse.ok) {
				console.error('Failed to create poll, status:', pollResponse.status);
				return this.http.error('Poll creation failed', 500);
			}

			const pollResponseData = await pollResponse.json();
			const validatedPollResponse = CreatePollResponseSchema.parse(pollResponseData);

			if (!validatedPollResponse.success || !validatedPollResponse.poll) {
				console.error(`Poll creation failed: ${validatedPollResponse.error}`);
				return this.http.error('Poll creation failed', 500);
			}

			const poll = validatedPollResponse.poll;

			// Register the poll room with actual poll metadata
			const roomMetadata: RoomMetadata = {
				id: pollId,
				title: poll.title,
				createdAt: new Date().toISOString(),
				activeConnections: 0,
				totalVotes: 0
			};

			// Add to registry
			this.roomRegistry.set(pollId, roomMetadata);

			// Save registry to storage
			await this.saveRegistry();

			this.broadcastRoomList();

			// Return validated response
			const response = CreatePollResponseSchema.parse({
				success: true,
				poll: poll
			});
			return this.http.success(response);
		} catch (error) {
			console.error('Error creating poll:', error);
			return this.http.error('Failed to create poll', 500);
		}
	}
}

LobbyServer satisfies Party.Worker;
