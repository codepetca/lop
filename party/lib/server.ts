import type * as Party from 'partykit/server';
import { useConnections, useHttpResponse } from './hooks';

/**
 * Base PartyKit server with common patterns built-in
 */
export abstract class PartyKitServer implements Party.Server {
	protected room: Party.Room;
	protected connections = useConnections();
	protected http = useHttpResponse();

	constructor(room: Party.Room) {
		this.room = room;
	}

	/**
	 * Override this method to set up your server
	 */
	abstract setup(): void | Promise<void>;

	/**
	 * Handle WebSocket messages - override if you need custom handling
	 */
	abstract handleMessage(message: string, sender: Party.Connection): void | Promise<void>;

	/**
	 * Handle HTTP requests - override if you need custom handling
	 */
	abstract handleRequest(req: Party.Request): Promise<Response>;

	// PartyKit lifecycle methods
	async onStart() {
		try {
			await this.setup();
		} catch (error) {
			console.error('Error during server setup:', error);
		}
	}

	async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
		this.connections.add(conn);
		await this.onConnectionOpen(conn, ctx);
	}

	async onClose(conn: Party.Connection) {
		this.connections.remove(conn);
		await this.onConnectionClose(conn);
	}

	async onMessage(message: string, sender: Party.Connection) {
		await this.handleMessage(message, sender);
	}

	async onRequest(req: Party.Request): Promise<Response> {
		try {
			return await this.handleRequest(req);
		} catch (error) {
			console.error('Error handling request:', error);
			return this.http.error('Internal server error');
		}
	}

	// Override these in your server for custom behavior
	protected async onConnectionOpen(conn: Party.Connection, ctx: Party.ConnectionContext) {
		// Override if needed
	}

	protected async onConnectionClose(conn: Party.Connection) {
		// Override if needed
	}
}
