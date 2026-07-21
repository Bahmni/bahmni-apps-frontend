import { ReadableStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';
import {
  confirmChatActions,
  deleteAiConversation,
  getAiConversation,
  listAiConversations,
  streamChatMessage,
} from '../aiChatService';
import { AI_CHAT_BASE_URL } from '../constants';

// jest-environment-jsdom doesn't provide these globals either.
globalThis.TextEncoder ??=
  TextEncoder as unknown as typeof globalThis.TextEncoder;
globalThis.TextDecoder ??=
  TextDecoder as unknown as typeof globalThis.TextDecoder;

// jest-environment-jsdom doesn't expose the Fetch API's Response/ReadableStream
// globals, so the minimal usage (ok/status/body/text()) is stubbed with plain objects.
interface FakeFetchResponse {
  ok: boolean;
  status: number;
  body: ReadableStream<Uint8Array> | null;
  text: () => Promise<string>;
}

function sseResponse(
  frames: Array<{ event: string; data: unknown }>,
): FakeFetchResponse {
  // The real backend (sse_starlette) ends lines with \r\n, not \n - match that
  // so this exercises the CRLF frame boundary.
  const body = frames
    .map(
      (frame) =>
        `event: ${frame.event}\r\ndata: ${JSON.stringify(frame.data)}\r\n\r\n`,
    )
    .join('');
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return { ok: true, status: 200, body: stream, text: async () => body };
}

function errorResponse(status: number, message: string): FakeFetchResponse {
  return {
    ok: false,
    status,
    body: null,
    text: async () => JSON.stringify({ error: message }),
  };
}

describe('aiChatService', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  describe('streamChatMessage', () => {
    it('posts to the bahmni-core proxy with the session cookie and no custom auth headers', async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          { event: 'conversation', data: { conversationId: 'conv-1' } },
          { event: 'done', data: {} },
        ]),
      );

      await streamChatMessage('hi', null, { onDelta: jest.fn() });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${AI_CHAT_BASE_URL}/chat`);
      expect(init.method).toBe('POST');
      expect(init.credentials).toBe('same-origin');
      expect(init.headers.Authorization).toBeUndefined();
      expect(init.headers['X-User-Id']).toBeUndefined();
      expect(JSON.parse(init.body)).toEqual({ message: 'hi' });
    });

    it('passes valid activity frames to onActivity and ignores malformed ones', async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          {
            event: 'activity',
            data: { id: 'm1', kind: 'model', state: 'started' },
          },
          {
            event: 'activity',
            data: {
              id: 't1',
              kind: 'tool',
              state: 'started',
              server: 'docs',
              tool: 'search',
            },
          },
          {
            event: 'activity',
            data: { id: 'x', kind: 'unknown-kind', state: 'started' },
          },
          { event: 'activity', data: { kind: 'model', state: 'started' } },
          {
            event: 'activity',
            data: { id: 'y', kind: 'model', state: 'paused' },
          },
          { event: 'text', data: { delta: 'ok' } },
          { event: 'done', data: {} },
        ]),
      );
      const onActivity = jest.fn();

      const result = await streamChatMessage('hi', null, {
        onDelta: jest.fn(),
        onActivity,
      });

      expect(onActivity.mock.calls.map(([a]) => a.id)).toEqual(['m1', 't1']);
      expect(result.text).toBe('ok');
    });

    it('still works against a backend that sends activity frames when no handler is given', async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          {
            event: 'activity',
            data: { id: 'm1', kind: 'model', state: 'started' },
          },
          { event: 'text', data: { delta: 'ok' } },
          { event: 'done', data: {} },
        ]),
      );

      await expect(
        streamChatMessage('hi', null, { onDelta: jest.fn() }),
      ).resolves.toMatchObject({ text: 'ok' });
    });

    it('sends the conversation id when continuing a conversation', async () => {
      fetchMock.mockResolvedValue(sseResponse([{ event: 'done', data: {} }]));

      await streamChatMessage('more', 'conv-9', { onDelta: jest.fn() });

      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        message: 'more',
        conversationId: 'conv-9',
      });
    });

    it('streams text deltas and returns the assembled text and conversation id', async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          { event: 'conversation', data: { conversationId: 'conv-1' } },
          { event: 'tool_started', data: { server: 's', tool: 't' } },
          { event: 'text', data: { delta: 'Hello' } },
          { event: 'text', data: { delta: ' world' } },
          { event: 'done', data: {} },
        ]),
      );
      const onDelta = jest.fn();

      const result = await streamChatMessage('hi', null, { onDelta });

      expect(onDelta.mock.calls).toEqual([['Hello'], [' world']]);
      expect(result).toEqual({
        text: 'Hello world',
        conversationId: 'conv-1',
        confirmation: null,
      });
    });

    it('returns the confirmation the assistant is waiting on', async () => {
      const confirmation = {
        confirmationId: 'c-1',
        expiresInSeconds: 300,
        actions: [{ id: 'a-1', server: 's', tool: 't', arguments: {} }],
      };
      fetchMock.mockResolvedValue(
        sseResponse([
          { event: 'conversation', data: { conversationId: 'conv-1' } },
          { event: 'confirmation_required', data: confirmation },
          { event: 'done', data: {} },
        ]),
      );

      const result = await streamChatMessage('do it', null, {
        onDelta: jest.fn(),
      });

      expect(result.confirmation).toEqual(confirmation);
    });

    it('throws with the status when the proxy answers with an error', async () => {
      fetchMock.mockResolvedValue(errorResponse(403, 'forbidden'));

      await expect(
        streamChatMessage('hi', null, { onDelta: jest.fn() }),
      ).rejects.toThrow('AI_CHAT_REQUEST_FAILED: 403');
    });

    it('throws when the stream carries an error event', async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          {
            event: 'error',
            data: { code: 'provider_error', message: 'model down' },
          },
        ]),
      );

      await expect(
        streamChatMessage('hi', null, { onDelta: jest.fn() }),
      ).rejects.toThrow('AI_CHAT_BACKEND_ERROR: provider_error model down');
    });
  });

  describe('confirmChatActions', () => {
    it('posts the answer to /chat/confirm and streams the rest of the reply', async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          { event: 'text', data: { delta: 'Done.' } },
          { event: 'done', data: {} },
        ]),
      );
      const onDelta = jest.fn();

      const result = await confirmChatActions('c-1', true, 'conv-1', {
        onDelta,
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(`${AI_CHAT_BASE_URL}/chat/confirm`);
      expect(JSON.parse(init.body)).toEqual({
        confirmationId: 'c-1',
        approved: true,
      });
      expect(onDelta).toHaveBeenCalledWith('Done.');
      expect(result.conversationId).toBe('conv-1');
    });
  });
});

describe('conversation history endpoints', () => {
  const jsonResponse = (status: number, body?: unknown) => ({
    ok: status < 400,
    status,
    json: async () => body,
    text: async () => (body ? JSON.stringify(body) : ''),
  });
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('lists the conversations with paging and the session cookie', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { conversations: [{ id: 'c1', title: 'T' }] }),
    );

    const result = await listAiConversations(10, 20);

    expect(result).toEqual([{ id: 'c1', title: 'T' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      `${AI_CHAT_BASE_URL}/conversations?limit=10&offset=20`,
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' }),
    );
  });

  it('reads one transcript, encoding the id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'a b', messages: [] }));

    await getAiConversation('a b');

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${AI_CHAT_BASE_URL}/conversations/a%20b`,
    );
  });

  it('deletes softly by default and permanently on request, handling 204', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204));

    await expect(deleteAiConversation('c1')).resolves.toBeUndefined();
    await deleteAiConversation('c1', true);

    expect(fetchMock.mock.calls[0]).toEqual([
      `${AI_CHAT_BASE_URL}/conversations/c1`,
      expect.objectContaining({ method: 'DELETE' }),
    ]);
    expect(fetchMock.mock.calls[1][0]).toBe(
      `${AI_CHAT_BASE_URL}/conversations/c1?hard=true`,
    );
  });

  it('reports a failed call with its status', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: 'nope' }));

    await expect(getAiConversation('x')).rejects.toThrow(
      /AI_CHAT_REQUEST_FAILED: 404/,
    );
  });
});
