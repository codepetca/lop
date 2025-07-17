import type * as Party from 'partykit/server';
import {
	RoomMetadata,
	RoomListRequestMessage,
	RoomListMessage,
	MessageSchema,
	Poll
} from './types';

export default class LobbyServer implements Party.Server {
	constructor(readonly room: Party.Room) {}

	// In-memory registry of active rooms
	private roomRegistry: Map<string, RoomMetadata> = new Map();

	// Load room registry from storage when the lobby starts
	async onStart() {
		const storedRegistry = await this.room.storage.get<[string, RoomMetadata][]>('roomRegistry');
		if (storedRegistry) {
			this.roomRegistry = new Map(storedRegistry);
			console.log(`Loaded ${this.roomRegistry.size} rooms from storage`);
		}
	}

	// Handle new WebSocket connections
	async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
		console.log('New connection to lobby:', conn.id);

		// Send current room list to new connection
		this.sendRoomList(conn);
	}

	// Handle incoming WebSocket messages
	async onMessage(message: string, sender: Party.Connection) {
		try {
			const data = JSON.parse(message);
			const validatedMessage = MessageSchema.parse(data);

			if (validatedMessage.type === 'room-list-request') {
				this.sendRoomList(sender);
			}
		} catch (error) {
			console.error('Error processing lobby message:', error);
		}
	}

	// Send room list to a specific connection
	private sendRoomList(conn: Party.Connection) {
		const rooms = Array.from(this.roomRegistry.values());
		const message: RoomListMessage = {
			type: 'room-list',
			rooms: rooms
		};

		conn.send(JSON.stringify(message));
	}

	// Broadcast room list to all connected clients
	private broadcastRoomList() {
		const rooms = Array.from(this.roomRegistry.values());
		const message: RoomListMessage = {
			type: 'room-list',
			rooms: rooms
		};

		this.room.broadcast(JSON.stringify(message));
	}

	// Save room registry to storage
	private async saveRegistry() {
		const registryArray = Array.from(this.roomRegistry.entries());
		await this.room.storage.put('roomRegistry', registryArray);
	}

	// Handle HTTP requests for room registration (from poll rooms)
	async onRequest(req: Party.Request): Promise<Response> {
		const url = new URL(req.url);
		console.log(`Lobby received ${req.method} request to: ${url.pathname} (full URL: ${req.url})`);

		if (
			req.method === 'POST' &&
			(url.pathname === '/register' || url.pathname.endsWith('/register'))
		) {
			try {
				const roomData = (await req.json()) as RoomMetadata;

				// Add room to registry
				this.roomRegistry.set(roomData.id, roomData);

				// Save registry to storage
				await this.saveRegistry();

				// Broadcast updated room list
				this.broadcastRoomList();

				console.log(`Registered room: ${roomData.id} - ${roomData.title}`);

				return new Response('Room registered', { status: 200 });
			} catch (error) {
				console.error('Error registering room:', error);
				return new Response('Failed to register room', { status: 500 });
			}
		}

		if (
			req.method === 'DELETE' &&
			(url.pathname.startsWith('/unregister/') || url.pathname.includes('/unregister/'))
		) {
			const roomId = url.pathname.split('/').pop();

			if (roomId && this.roomRegistry.has(roomId)) {
				this.roomRegistry.delete(roomId);
				
				// Save registry to storage
				await this.saveRegistry();
				
				this.broadcastRoomList();

				console.log(`Unregistered room: ${roomId}`);

				return new Response('Room unregistered', { status: 200 });
			}

			return new Response('Room not found', { status: 404 });
		}

		// Handle poll creation requests
		if (req.method === 'POST' && url.pathname.endsWith('/create-poll')) {
			try {
				// Consume the request body even though we don't need it
				// This prevents PartyKit from trying to read it after response is sent
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
					return new Response('Failed to create poll', { status: 500 });
				}

				const poll = (await pollResponse.json()) as Poll;
				console.log(`Poll created successfully: ${poll.title}`);

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

				// Return the poll data from the actual poll server
				return new Response(JSON.stringify(poll), {
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (error) {
				console.error('Error creating poll:', error);
				return new Response('Failed to create poll', { status: 500 });
			}
		}

		return new Response('Method not allowed', { status: 405 });
	}
}

LobbyServer satisfies Party.Worker;
