import type * as Party from 'partykit/server';
import { z } from 'zod';

/**
 * Message handler hook for type-safe WebSocket message handling
 */
export function useMessageHandler<T extends z.ZodDiscriminatedUnion<any>>(
	schema: T,
	room: Party.Room
) {
	type MessageType = z.infer<T>;
	type Handler<M extends MessageType> = (
		message: M,
		sender: Party.Connection
	) => void | Promise<void>;

	const handlers = new Map<string, Handler<any>>();

	// Register a handler for a specific message type
	function handle<K extends MessageType['type']>(
		type: K,
		handler: Handler<Extract<MessageType, { type: K }>>
	) {
		handlers.set(type, handler);
	}

	// Process incoming messages
	async function processMessage(message: string, sender: Party.Connection) {
		try {
			const data = JSON.parse(message);
			const validatedMessage = schema.parse(data) as MessageType;

			const handler = handlers.get(validatedMessage.type);
			if (handler) {
				await handler(validatedMessage, sender);
			} else {
				console.warn(`No handler for message type: ${validatedMessage.type}`);
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				console.error('Message validation failed:', error.issues);
			} else {
				console.error('Error processing message:', error);
			}
		}
	}

	return { handle, processMessage };
}

/**
 * Broadcast hook for type-safe message broadcasting
 */
export function useBroadcast<T extends Record<string, any>>(room: Party.Room) {
	// Send message to specific connection
	function send(connection: Party.Connection, message: T) {
		connection.send(JSON.stringify(message));
	}

	// Broadcast message to all connections
	function broadcast(message: T) {
		room.broadcast(JSON.stringify(message));
	}

	// Broadcast to all except sender
	function broadcastExcept(sender: Party.Connection, message: T) {
		room.broadcast(JSON.stringify(message), [sender.id]);
	}

	return { send, broadcast, broadcastExcept };
}

/**
 * Storage hook for type-safe PartyKit storage
 */
export function useStorage<T extends Record<string, any>>(room: Party.Room) {
	// Get value from storage
	async function get<K extends keyof T>(key: K): Promise<T[K] | null> {
		const value = await room.storage.get<T[K]>(key as string);
		return value ?? null;
	}

	// Set value in storage
	async function set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
		await room.storage.put(key as string, value);
	}

	// Delete value from storage
	async function remove<K extends keyof T>(key: K): Promise<void> {
		await room.storage.delete(key as string);
	}

	// Get all values
	async function getAll(): Promise<Partial<T>> {
		const entries = await room.storage.list<T[keyof T]>();
		const result: Partial<T> = {};

		entries.forEach((value, key) => {
			result[key as keyof T] = value;
		});

		return result;
	}

	return { get, set, remove, getAll };
}

/**
 * HTTP response hook for consistent API responses
 */
export function useHttpResponse() {
	// Success response
	function success<T>(data: T, status = 200) {
		return new Response(JSON.stringify(data), {
			status,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Error response
	function error(message: string, status = 500) {
		return new Response(JSON.stringify({ error: message }), {
			status,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Not found response
	function notFound(message = 'Not found') {
		return error(message, 404);
	}

	// Method not allowed
	function methodNotAllowed() {
		return new Response('Method not allowed', { status: 405 });
	}

	return { success, error, notFound, methodNotAllowed };
}

/**
 * Connection tracking hook
 */
export function useConnections() {
	const connections = new Set<Party.Connection>();

	function add(conn: Party.Connection) {
		connections.add(conn);
	}

	function remove(conn: Party.Connection) {
		connections.delete(conn);
	}

	function count() {
		return connections.size;
	}

	function getAll() {
		return Array.from(connections);
	}

	return { add, remove, count, getAll };
}
