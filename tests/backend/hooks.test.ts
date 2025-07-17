import { describe, it, expect, vi } from 'vitest';
import { MessageSchema } from '../../shared/schemas/message';
import {
	useMessageHandler,
	useBroadcast,
	useStorage,
	useHttpResponse
} from '../../party/lib/hooks';
import { createMockRoom, createMockConnection } from '../utils/mocks';
import { createVoteMessage, createPollUpdateMessage } from '../utils/fixtures';

describe('Backend Hooks', () => {
	describe('useMessageHandler', () => {
		it('should handle valid messages', async () => {
			const room = createMockRoom();
			const { handle, processMessage } = useMessageHandler(MessageSchema, room);

			const voteHandler = vi.fn();
			handle('vote', voteHandler);

			const sender = createMockConnection();
			const voteMessage = createVoteMessage();

			await processMessage(JSON.stringify(voteMessage), sender);

			expect(voteHandler).toHaveBeenCalledWith(voteMessage, sender);
		});

		it('should handle multiple message types', async () => {
			const room = createMockRoom();
			const { handle, processMessage } = useMessageHandler(MessageSchema, room);

			const voteHandler = vi.fn();
			const pollUpdateHandler = vi.fn();
			handle('vote', voteHandler);
			handle('poll-update', pollUpdateHandler);

			const sender = createMockConnection();

			// Test vote message
			const voteMessage = createVoteMessage();
			await processMessage(JSON.stringify(voteMessage), sender);
			expect(voteHandler).toHaveBeenCalledWith(voteMessage, sender);

			// Test poll update message
			const pollUpdateMessage = createPollUpdateMessage();
			await processMessage(JSON.stringify(pollUpdateMessage), sender);
			expect(pollUpdateHandler).toHaveBeenCalledWith(pollUpdateMessage, sender);
		});

		it('should warn about unhandled message types', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const room = createMockRoom();
			const { processMessage } = useMessageHandler(MessageSchema, room);

			const sender = createMockConnection();
			const voteMessage = createVoteMessage();

			await processMessage(JSON.stringify(voteMessage), sender);

			expect(consoleSpy).toHaveBeenCalledWith('No handler for message type: vote');
			consoleSpy.mockRestore();
		});

		it('should handle malformed JSON gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const room = createMockRoom();
			const { processMessage } = useMessageHandler(MessageSchema, room);

			const sender = createMockConnection();

			await processMessage('invalid json', sender);

			expect(consoleSpy).toHaveBeenCalledWith('Error processing message:', expect.any(Error));
			consoleSpy.mockRestore();
		});

		it('should handle schema validation errors', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const room = createMockRoom();
			const { processMessage } = useMessageHandler(MessageSchema, room);

			const sender = createMockConnection();
			const invalidMessage = { type: 'invalid-type', data: 'test' };

			await processMessage(JSON.stringify(invalidMessage), sender);

			expect(consoleSpy).toHaveBeenCalledWith('Message validation failed:', expect.any(Array));
			consoleSpy.mockRestore();
		});
	});

	describe('useBroadcast', () => {
		it('should send message to specific connection', () => {
			const room = createMockRoom();
			const connection = createMockConnection();
			const { send } = useBroadcast(room);

			const message = { type: 'test', data: 'hello' };
			send(connection, message);

			expect(connection.send).toHaveBeenCalledWith(JSON.stringify(message));
		});

		it('should broadcast message to all connections', () => {
			const room = createMockRoom();
			const { broadcast } = useBroadcast(room);

			const message = { type: 'test', data: 'hello' };
			broadcast(message);

			expect(room.broadcast).toHaveBeenCalledWith(JSON.stringify(message));
		});

		it('should broadcast to all except sender', () => {
			const room = createMockRoom();
			const sender = createMockConnection('sender-123');
			const { broadcastExcept } = useBroadcast(room);

			const message = { type: 'test', data: 'hello' };
			broadcastExcept(sender, message);

			expect(room.broadcast).toHaveBeenCalledWith(JSON.stringify(message), ['sender-123']);
		});
	});

	describe('useStorage', () => {
		it('should get value from storage', async () => {
			const room = createMockRoom();
			room._setStorageItem('test-key', 'test-value');
			const { get } = useStorage(room);

			const result = await get('test-key');

			expect(result).toBe('test-value');
			expect(room.storage.get).toHaveBeenCalledWith('test-key');
		});

		it('should return null for non-existent key', async () => {
			const room = createMockRoom();
			const { get } = useStorage(room);

			const result = await get('non-existent-key');

			expect(result).toBeNull();
		});

		it('should set value in storage', async () => {
			const room = createMockRoom();
			const { set } = useStorage(room);

			await set('test-key', 'test-value');

			expect(room.storage.put).toHaveBeenCalledWith('test-key', 'test-value');
		});

		it('should remove value from storage', async () => {
			const room = createMockRoom();
			const { remove } = useStorage(room);

			await remove('test-key');

			expect(room.storage.delete).toHaveBeenCalledWith('test-key');
		});
	});

	describe('useHttpResponse', () => {
		it('should create success response', () => {
			const { success } = useHttpResponse();
			const data = { message: 'success' };

			const response = success(data);

			expect(response).toBeInstanceOf(Response);
			expect(response.status).toBe(200);
		});

		it('should create success response with custom status', () => {
			const { success } = useHttpResponse();
			const data = { message: 'created' };

			const response = success(data, 201);

			expect(response.status).toBe(201);
		});

		it('should create error response', () => {
			const { error } = useHttpResponse();

			const response = error('Something went wrong');

			expect(response).toBeInstanceOf(Response);
			expect(response.status).toBe(500);
		});

		it('should create error response with custom status', () => {
			const { error } = useHttpResponse();

			const response = error('Bad request', 400);

			expect(response.status).toBe(400);
		});

		it('should create not found response', () => {
			const { notFound } = useHttpResponse();

			const response = notFound();

			expect(response.status).toBe(404);
		});

		it('should create method not allowed response', () => {
			const { methodNotAllowed } = useHttpResponse();

			const response = methodNotAllowed();

			expect(response.status).toBe(405);
		});
	});
});
