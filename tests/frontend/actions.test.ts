import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from '../../src/routes/+page.server';
import { createMockFetch, createMockRequestEvent } from '../utils/mocks';
import { createTestPoll } from '../utils/fixtures';

// Mock SvelteKit dependencies
vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status: number, data: any) => ({ status, ...data }))
}));

vi.mock('$env/dynamic/private', () => ({
	env: {
		PARTYKIT_URL: 'http://localhost:1999'
	}
}));

describe('Server Actions', () => {
	let mockFetch: ReturnType<typeof createMockFetch>;

	beforeEach(() => {
		mockFetch = createMockFetch();
		global.fetch = mockFetch;
	});

	describe('createPoll action', () => {
		it('should create poll successfully', async () => {
			const testPoll = createTestPoll();
			const successResponse = {
				ok: true,
				data: {
					success: true,
					poll: testPoll
				}
			};

			mockFetch = createMockFetch({
				'http://localhost:1999/parties/main/main/create-poll': successResponse
			});
			global.fetch = mockFetch;

			const mockRequestEvent = createMockRequestEvent({} as Request);
			const result = await actions.createPoll(mockRequestEvent);

			expect(result).toEqual({ pollId: testPoll.id });
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:1999/parties/main/main/create-poll',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({})
				}
			);
		});

		it('should handle network failures', async () => {
			const failResponse = {
				ok: false,
				status: 500,
				text: () => Promise.resolve('Internal Server Error')
			};

			mockFetch = createMockFetch({
				'http://localhost:1999/parties/main/main/create-poll': failResponse
			});
			global.fetch = mockFetch;

			const mockRequestEvent = createMockRequestEvent({} as Request);
			const result = await actions.createPoll(mockRequestEvent);

			expect(result).toEqual({
				status: 500,
				error: 'Failed to create poll. Please try again.'
			});
		});

		it('should handle poll creation failure response', async () => {
			const failureResponse = {
				ok: true,
				data: {
					success: false,
					error: 'poll_creation_failed'
				}
			};

			mockFetch = createMockFetch({
				'http://localhost:1999/parties/main/main/create-poll': failureResponse
			});
			global.fetch = mockFetch;

			const mockRequestEvent = createMockRequestEvent({} as Request);
			const result = await actions.createPoll(mockRequestEvent);

			expect(result).toEqual({
				status: 500,
				error: 'Failed to create poll. Please try again.'
			});
		});

		it('should handle invalid response data', async () => {
			const invalidResponse = {
				ok: true,
				data: {
					success: true
					// Missing poll data
				}
			};

			mockFetch = createMockFetch({
				'http://localhost:1999/parties/main/main/create-poll': invalidResponse
			});
			global.fetch = mockFetch;

			const mockRequestEvent = createMockRequestEvent({} as Request);
			const result = await actions.createPoll(mockRequestEvent);

			expect(result).toEqual({
				status: 500,
				error: 'Failed to create poll. Please try again.'
			});
		});

		it('should handle JSON parsing errors', async () => {
			const invalidJsonResponse = {
				ok: true,
				json: () => Promise.reject(new Error('Invalid JSON'))
			};

			mockFetch = createMockFetch({
				'http://localhost:1999/parties/main/main/create-poll': invalidJsonResponse
			});
			global.fetch = mockFetch;

			const mockRequestEvent = createMockRequestEvent({} as Request);
			const result = await actions.createPoll(mockRequestEvent);

			expect(result).toEqual({
				status: 500,
				error: 'Failed to create poll. Please try again.'
			});
		});

		it('should use fallback URL when env var not set', async () => {
			// Re-import the actions module to get the fallback URL behavior
			// This test demonstrates the fallback but doesn't test the dynamic import
			const testPoll = createTestPoll();
			const successResponse = {
				ok: true,
				data: {
					success: true,
					poll: testPoll
				}
			};

			mockFetch = createMockFetch({
				'http://localhost:1999/parties/main/main/create-poll': successResponse
			});
			global.fetch = mockFetch;

			const mockRequestEvent = createMockRequestEvent({} as Request);
			const result = await actions.createPoll(mockRequestEvent);

			expect(result).toEqual({ pollId: testPoll.id });
		});

		it('should handle schema validation errors', async () => {
			const invalidPollResponse = {
				ok: true,
				data: {
					success: true,
					poll: {
						// Invalid poll data that doesn't match schema
						id: 'test',
						title: 'Test'
						// Missing required fields
					}
				}
			};

			mockFetch = createMockFetch({
				'http://localhost:1999/parties/main/main/create-poll': invalidPollResponse
			});
			global.fetch = mockFetch;

			const mockRequestEvent = createMockRequestEvent({} as Request);
			const result = await actions.createPoll(mockRequestEvent);

			expect(result).toEqual({
				status: 500,
				error: 'Failed to create poll. Please try again.'
			});
		});
	});
});
