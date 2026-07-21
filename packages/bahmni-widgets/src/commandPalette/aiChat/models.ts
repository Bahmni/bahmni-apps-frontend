export type AiChatMessageStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'error';

export interface AiChatPendingAction {
  id: string;
  server: string;
  tool: string;
  arguments: Record<string, unknown>;
}

/** Actions the assistant wants to run that wait for the user's approval. */
export interface AiChatPendingConfirmation {
  confirmationId: string;
  actions: AiChatPendingAction[];
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: AiChatMessageStatus;
  /** Present while an approval is outstanding; cleared once answered. */
  pendingConfirmation?: AiChatPendingConfirmation;
}

export interface AiConversation {
  id: string;
  userId: string;
  /** Id of this conversation on bahmni-ai, set lazily on first send. */
  backendConversationId?: string;
  title: string;
  messages: AiChatMessage[];
  /** False for a conversation known only from the server's list until its transcript is fetched. */
  messagesLoaded: boolean;
  createdAt: string;
  updatedAt: string;
}
