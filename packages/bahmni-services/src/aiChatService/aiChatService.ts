import { AI_CHAT_BASE_URL } from './constants';

export interface AiChatPendingAction {
  id: string;
  server: string;
  tool: string;
  arguments: Record<string, unknown>;
}

export interface AiChatConfirmation {
  confirmationId: string;
  expiresInSeconds: number;
  actions: AiChatPendingAction[];
}

/**
 * Temporary "what the assistant is doing" line (SSE event `activity`). Codes and ids only: the text shown to the
 * user is built from `kind` by the UI. Every activity is dropped when the stream ends (done, error, confirmation).
 */
export interface AiChatActivity {
  id: string;
  /** model: waiting for the model, thinking, tool: running a tool, retry: the AI service is busy, trying again. */
  kind: 'model' | 'thinking' | 'tool' | 'retry';
  state: 'started' | 'finished';
  server?: string;
  tool?: string;
  attempt?: number;
}

const ACTIVITY_KINDS = ['model', 'thinking', 'tool', 'retry'];

const isActivity = (data: unknown): data is AiChatActivity => {
  const candidate = data as Partial<AiChatActivity> | null;
  return (
    !!candidate &&
    typeof candidate.id === 'string' &&
    ACTIVITY_KINDS.includes(candidate.kind as string) &&
    (candidate.state === 'started' || candidate.state === 'finished')
  );
};

export interface AiChatStreamHandlers {
  onDelta: (text: string) => void;
  /** Optional: progress lines for the in-flight reply. Older backends never send them. */
  onActivity?: (activity: AiChatActivity) => void;
}

export interface AiChatStreamResult {
  text: string;
  conversationId: string | null;
  /** Set when the assistant wants to run actions that need the user's approval. */
  confirmation: AiChatConfirmation | null;
}

const readErrorBody = async (response: Response): Promise<string> =>
  response.text().catch(() => '');

const postStream = async (
  path: string,
  body: Record<string, unknown>,
  previousConversationId: string | null,
  { onDelta, onActivity }: AiChatStreamHandlers,
): Promise<AiChatStreamResult> => {
  // Same-origin fetch sends the JSESSIONID cookie. bahmni-core checks the
  // session and the AI privilege, then forwards to bahmni-ai. Deliberately not
  // the shared `../api` client: its interceptors assume an OpenMRS JSON
  // response, and this endpoint streams Server-Sent Events.
  const response = await fetch(`${AI_CHAT_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const errorBody = await readErrorBody(response);
    throw new Error(
      `AI_CHAT_REQUEST_FAILED: ${response.status} ${errorBody}`.trim(),
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let conversationId = previousConversationId;
  let confirmation: AiChatConfirmation | null = null;
  let streamDone = false;

  const handleFrame = (rawFrame: string) => {
    const lines = rawFrame.split('\n');
    const eventLine = lines.find((line) => line.startsWith('event:'));
    const dataLine = lines.find((line) => line.startsWith('data:'));
    if (!eventLine || !dataLine) return;

    const eventName = eventLine.slice('event:'.length).trim();
    const payload = dataLine.slice('data:'.length).trim();
    const data = payload ? JSON.parse(payload) : {};

    if (
      eventName === 'conversation' &&
      typeof data.conversationId === 'string'
    ) {
      conversationId = data.conversationId;
    } else if (eventName === 'text' && typeof data.delta === 'string') {
      fullText += data.delta;
      onDelta(data.delta);
    } else if (eventName === 'activity') {
      if (isActivity(data)) onActivity?.(data);
    } else if (eventName === 'confirmation_required') {
      confirmation = data as AiChatConfirmation;
    } else if (eventName === 'done') {
      streamDone = true;
    } else if (eventName === 'error') {
      throw new Error(
        `AI_CHAT_BACKEND_ERROR: ${data.code ?? 'unknown'} ${data.message ?? ''}`.trim(),
      );
    }
    // tool_started / tool_finished / servers_unavailable are superseded for the UI by `activity`.
  };

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;

    // sse_starlette ends lines with \r\n; normalise so frame boundaries match.
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    frames.forEach(handleFrame);
  }

  return { text: fullText, conversationId, confirmation };
};

/**
 * Sends a user message to `POST /chat` and streams the assistant's reply via
 * `onDelta`. Pass `conversationId: null` to start a new conversation; its id
 * arrives in the `conversation` event. The backend keeps the history, so only
 * the latest message is sent.
 */
export const streamChatMessage = (
  message: string,
  conversationId: string | null,
  handlers: AiChatStreamHandlers,
): Promise<AiChatStreamResult> =>
  postStream(
    '/chat',
    conversationId ? { message, conversationId } : { message },
    conversationId,
    handlers,
  );

/**
 * Answers a `confirmation_required` event via `POST /chat/confirm` and streams
 * the rest of the reply. Confirmations are single-use and expire; a rejected
 * action is reported to the assistant, which then answers without running it.
 */
export const confirmChatActions = (
  confirmationId: string,
  approved: boolean,
  conversationId: string | null,
  handlers: AiChatStreamHandlers,
): Promise<AiChatStreamResult> =>
  postStream(
    '/chat/confirm',
    { confirmationId, approved },
    conversationId,
    handlers,
  );

export interface AiConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiTranscriptMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string | null;
  tools?: Array<{ server: string; tool: string }>;
}

export interface AiConversationTranscript extends AiConversationSummary {
  messages: AiTranscriptMessage[];
}

/** JSON call to the conversation endpoints (history lives on the server, not in the browser). */
const requestJson = async <T>(
  path: string,
  method: 'GET' | 'DELETE',
): Promise<T> => {
  const response = await fetch(`${AI_CHAT_BASE_URL}${path}`, {
    method,
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new Error(
      `AI_CHAT_REQUEST_FAILED: ${response.status} ${errorBody}`.trim(),
    );
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
};

/** The signed-in user's conversations, most recent first. */
export const listAiConversations = async (
  limit = 50,
  offset = 0,
): Promise<AiConversationSummary[]> => {
  const result = await requestJson<{ conversations: AiConversationSummary[] }>(
    `/conversations?limit=${limit}&offset=${offset}`,
    'GET',
  );
  return result.conversations;
};

/** One conversation's transcript (user and assistant text only). */
export const getAiConversation = (
  conversationId: string,
): Promise<AiConversationTranscript> =>
  requestJson<AiConversationTranscript>(
    `/conversations/${encodeURIComponent(conversationId)}`,
    'GET',
  );

/** Soft delete by default (hidden from the user); `hard` removes it permanently. */
export const deleteAiConversation = (
  conversationId: string,
  hard = false,
): Promise<void> =>
  requestJson<void>(
    `/conversations/${encodeURIComponent(conversationId)}${hard ? '?hard=true' : ''}`,
    'DELETE',
  );
