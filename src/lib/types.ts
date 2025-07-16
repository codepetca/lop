export interface Poll {
	id: string;
	title: string;
	options: string[];
	votes: { [option: string]: number };
}

export interface VoteMessage {
	type: 'vote';
	option: string;
}

export interface PollUpdateMessage {
	type: 'poll-update';
	poll: Poll;
}

export interface RoomMetadata {
	id: string;
	title: string;
	createdAt: string;
	activeConnections: number;
	totalVotes: number;
}

export interface RoomListRequestMessage {
	type: 'room-list-request';
}

export interface RoomListMessage {
	type: 'room-list';
	rooms: RoomMetadata[];
}

export type Message = VoteMessage | PollUpdateMessage | RoomListRequestMessage | RoomListMessage;
