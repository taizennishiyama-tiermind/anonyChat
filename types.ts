export interface Message {
  id: string;
  text: string;
  timestamp: string;
  user_id: string;
  isSender: boolean;
  room_id: string;
  is_host?: boolean;
  host_name?: string;
  mentions?: string[];
}

export type ReactionType = 'like' | 'idea' | 'question' | 'confused';

export interface Reaction {
  id: string;
  type: ReactionType;
  timestamp: string;
  room_id: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  room_id: string;
  timestamp: string;
  type: ReactionType;
}
