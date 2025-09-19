export interface Message {
  id: string;
  text: string;
  timestamp: string;
  user_id: string;
  isSender: boolean;
  room_id: string;
}

export type ReactionType = 'like' | 'idea' | 'question' | 'confused';

export interface Reaction {
  id: string;
  type: ReactionType;
  timestamp: string;
  room_id: string;
}
