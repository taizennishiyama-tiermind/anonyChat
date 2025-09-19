export interface Message {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
  isSender: boolean;
}

export type ReactionType = 'like' | 'idea' | 'question' | 'confused';

export interface Reaction {
  id: string;
  type: ReactionType;
  timestamp: number;
}
