export interface Message {
  timestamp: number;
  senderId: string;
  content: string;
}

export interface User {
  id: string;
  typing: boolean;
}

export interface MessageEvent {
  event: "message";
  data: Message[];
}

export interface UserEvent {
  event: "user";
  data: User;
}

/** Server Sent Event */
export type SSE = MessageEvent | UserEvent;
