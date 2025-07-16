import type * as Party from 'partykit/server';
import { RoomMetadata, RoomListRequestMessage, RoomListMessage, MessageSchema } from './types';

export default class LobbyServer implements Party.Server {
	constructor(readonly room: Party.Room) {}

	// In-memory registry of active rooms
	private roomRegistry: Map<string, RoomMetadata> = new Map();

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

	// Handle HTTP requests for room registration (from poll rooms)
	async onRequest(req: Party.Request): Promise<Response> {
		const url = new URL(req.url);
		console.log(`Lobby received ${req.method} request to: ${url.pathname} (full URL: ${req.url})`);

		if (req.method === 'POST' && (url.pathname === '/register' || url.pathname.endsWith('/register'))) {
			try {
				const roomData = await req.json() as RoomMetadata;
				
				// Add room to registry
				this.roomRegistry.set(roomData.id, roomData);
				
				// Broadcast updated room list
				this.broadcastRoomList();
				
				console.log(`Registered room: ${roomData.id} - ${roomData.title}`);
				
				return new Response('Room registered', { status: 200 });
			} catch (error) {
				console.error('Error registering room:', error);
				return new Response('Failed to register room', { status: 500 });
			}
		}

		if (req.method === 'DELETE' && (url.pathname.startsWith('/unregister/') || url.pathname.includes('/unregister/'))) {
			const roomId = url.pathname.split('/').pop();
			
			if (roomId && this.roomRegistry.has(roomId)) {
				this.roomRegistry.delete(roomId);
				this.broadcastRoomList();
				
				console.log(`Unregistered room: ${roomId}`);
				
				return new Response('Room unregistered', { status: 200 });
			}
			
			return new Response('Room not found', { status: 404 });
		}

		return new Response('Method not allowed', { status: 405 });
	}
}

LobbyServer satisfies Party.Worker;