export interface Conversation {
  id: number;
  username: string;
  isOnline: boolean;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
}
