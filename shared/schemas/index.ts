/**
 * Centralized Schema Exports
 *
 * This file re-exports all schemas and types organized by domain:
 * - Player: Base player types and domain-specific extensions
 * - Poll: Polling functionality with individual vote tracking
 * - Game: Story-based multiplayer games
 * - Message: WebSocket communication messages
 * - API: HTTP request/response schemas
 * - Story: Story template definitions
 */

// Core player schemas (base for both polls and games)
export * from './player';

// Domain-specific schemas
export * from './poll';
export * from './game';
export * from './story';

// Communication schemas
export * from './message';
export * from './api';
