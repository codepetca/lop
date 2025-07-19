import { browser } from '$app/environment';
import { generatePlayerName, isGeneratedName } from '$lib/stores/nameGenerator';
import {
	generateAvatarFromPlayerId,
	generateNewRandomAvatar,
	type AvatarConfig
} from '$lib/avatar/utils';
import type { Player } from '$lib/types';

interface AppState {
	player: Player | null;
}

const STORAGE_KEY = 'lop_app_state';

function createStore() {
	// Initialize state
	let state = $state<AppState>({
		player: null
	});

	// Load from localStorage on initialization
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as AppState;
				if (parsed.player) {
					state.player = parsed.player;
				}
			}
		} catch (error) {
			console.error('Failed to load app state from localStorage:', error);
		}
	}

	// Helper function to sync to localStorage
	function syncToStorage() {
		if (browser && state.player) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify({ player: state.player }));
			} catch (error) {
				console.error('Failed to save app state to localStorage:', error);
			}
		}
	}

	// Generate a UUID v4
	function generateId(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	// Generate a unique name with timestamp suffix to avoid collisions
	function generateUniqueName(): string {
		const baseName = generatePlayerName();
		// Add a short timestamp suffix to ensure uniqueness
		const timestamp = Date.now().toString().slice(-4);
		return `${baseName}${timestamp}`;
	}

	return {
		// Getters
		get player() {
			return state.player;
		},

		// Initialize or get existing player
		initializePlayer() {
			if (!state.player) {
				const id = generateId();
				const name = generateUniqueName();
				state.player = {
					id,
					name,
					isGenerated: true,
					createdAt: Date.now(),
					avatar: generateAvatarFromPlayerId(id)
				};
				syncToStorage();
			} else if (!state.player.avatar) {
				// Migration: Add avatar to existing players
				state.player = {
					...state.player,
					avatar: generateAvatarFromPlayerId(state.player.id)
				};
				syncToStorage();
			}
			return state.player;
		},

		// Update player name
		updatePlayerName(name: string) {
			if (!state.player) {
				this.initializePlayer();
			}
			if (state.player) {
				state.player = {
					...state.player,
					name,
					isGenerated: isGeneratedName(name)
				};
				syncToStorage();
			}
		},

		// Generate a new random name
		generateNewName() {
			if (!state.player) {
				this.initializePlayer();
			} else {
				const name = generateUniqueName();
				state.player = {
					...state.player,
					name,
					isGenerated: true
				};
				syncToStorage();
			}
		},

		// Update player avatar
		updatePlayerAvatar(avatar: AvatarConfig) {
			if (!state.player) {
				this.initializePlayer();
			}
			if (state.player) {
				state.player = {
					...state.player,
					avatar
				};
				syncToStorage();
			}
		},

		// Generate a new random avatar
		generateNewAvatar() {
			if (!state.player) {
				this.initializePlayer();
			} else {
				const avatar = generateNewRandomAvatar();
				state.player = {
					...state.player,
					avatar
				};
				syncToStorage();
			}
		},

		// Reset player data
		reset() {
			state.player = null;
			if (browser) {
				try {
					localStorage.removeItem(STORAGE_KEY);
				} catch (error) {
					console.error('Failed to clear localStorage:', error);
				}
			}
		}
	};
}

// Create and export a singleton instance
export const store = createStore();
