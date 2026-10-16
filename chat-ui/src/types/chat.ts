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

export interface DisplayMessage extends ChatMessage {
  isPendingDelivery?: boolean;
}

export interface IncomingChatMessage {
  id: number;
  from: number;
  message: string;
  sent_at: string;
}

export interface OfflineDeliveryInfo {
  info: string;
}

export type ChatSocketEvent =
  | { type: "message"; message: IncomingChatMessage }
  | { type: "info"; info: OfflineDeliveryInfo };
