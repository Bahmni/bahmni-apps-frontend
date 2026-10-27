import {
  confirmChatActions,
  getCurrentUser,
  streamChatMessage,
} from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useAiChatStore } from '../aiChatStore';
import { useAiChat } from '../useAiChat';

jest.mock('@bahmni/services', () => ({
  confirmChatActions: jest.fn(),
  getCurrentUser: jest.fn(),
  streamChatMessage: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockStreamChatMessage = streamChatMessage as jest.Mock;
const mockConfirmChatActions = confirmChatActions as jest.Mock;

describe('useAiChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useAiChatStore.setState({
      conversationsByUser: {},
      activeConversationId: null,
      isExpanded: false,
    });
    mockGetCurrentUser.mockResolvedValue({
      uuid: 'user-1',
      username: 'jdoe',
      display: 'J Doe',
    });
  });

  it('does nothing for a blank message', async () => {
    const { result } = renderHook(() => useAiChat());
    await waitFor(() =>
      expect(result.current.activeConversation).toBeDefined(),
    );

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(mockStreamChatMessage).not.toHaveBeenCalled();
  });

  it('sends no conversation id on the first send, appends messages, streams deltas, and remembers the returned conversation id', async () => {
    mockStreamChatMessage.mockImplementation(
      async (_content, _conversationId, { onDelta }) => {
        onDelta('Hello');
        onDelta(' world');
        return {
          text: 'Hello world',
          conversationId: 'backend-conv-1',
          confirmation: null,
        };
      },
    );

    const { result } = renderHook(() => useAiChat());
    await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled());
    // Flush the getCurrentUser().then(setUserId) microtask so userId is populated.
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.sendMessage('hi there');
    });

    expect(mockStreamChatMessage).toHaveBeenCalledWith('hi there', null, {
      onDelta: expect.any(Function),
      onActivity: expect.any(Function),
    });

    expect(result.current.activeConversation?.messages).toHaveLength(2);
    const [userMessage, assistantMessage] =
      result.current.activeConversation!.messages;
    expect(userMessage).toMatchObject({ role: 'user', content: 'hi there' });
    expect(assistantMessage).toMatchObject({
      role: 'assistant',
      content: 'Hello world',
      status: 'complete',
    });
    expect(result.current.activeConversation?.backendConversationId).toBe(
      'backend-conv-1',
    );
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sends the already-known conversation id for subsequent messages in the same conversation', async () => {
    mockStreamChatMessage.mockImplementation(
      async (_content, _conversationId, { onDelta }) => {
        onDelta('ok');
        return {
          text: 'ok',
          conversationId: 'backend-conv-1',
          confirmation: null,
        };
      },
    );
    const { result } = renderHook(() => useAiChat());
    await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled());
    // Flush the getCurrentUser().then(setUserId) microtask so userId is populated.
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.sendMessage('first');
    });
    await act(async () => {
      await result.current.sendMessage('second');
    });

    expect(mockStreamChatMessage).toHaveBeenNthCalledWith(1, 'first', null, {
      onDelta: expect.any(Function),
      onActivity: expect.any(Function),
    });
    expect(mockStreamChatMessage).toHaveBeenNthCalledWith(
      2,
      'second',
      'backend-conv-1',
      { onDelta: expect.any(Function), onActivity: expect.any(Function) },
    );
  });

  it('marks the assistant message as errored and surfaces the error when streaming fails', async () => {
    mockStreamChatMessage.mockRejectedValue(
      new Error('AI_CHAT_BACKEND_ERROR: internal error'),
    );

    const { result } = renderHook(() => useAiChat());
    await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled());
    // Flush the getCurrentUser().then(setUserId) microtask so userId is populated.
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.sendMessage('hi');
    });

    expect(result.current.error).toBe('AI_CHAT_BACKEND_ERROR: internal error');
    const assistantMessage = result.current.activeConversation?.messages[1];
    expect(assistantMessage?.status).toBe('error');
  });

  describe('confirmations', () => {
    const confirmation = {
      confirmationId: 'c-1',
      expiresInSeconds: 300,
      actions: [
        { id: 'a-1', server: 'documents', tool: 'create_doc', arguments: {} },
      ],
    };

    const sendAndWaitForConfirmation = async () => {
      mockStreamChatMessage.mockResolvedValue({
        text: '',
        conversationId: 'backend-conv-1',
        confirmation,
      });
      const hook = renderHook(() => useAiChat());
      await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled());
      await act(async () => {
        await Promise.resolve();
      });
      await act(async () => {
        await hook.result.current.sendMessage('create it');
      });
      return hook;
    };

    it('keeps the pending confirmation on the assistant message', async () => {
      const { result } = await sendAndWaitForConfirmation();

      expect(
        result.current.activeConversation?.messages[1].pendingConfirmation,
      ).toMatchObject({
        confirmationId: 'c-1',
        actions: confirmation.actions,
      });
    });

    it('sends the answer, streams the rest into the same message and clears the confirmation', async () => {
      const { result } = await sendAndWaitForConfirmation();
      mockConfirmChatActions.mockImplementation(
        async (_id, _approved, _conversationId, { onDelta }) => {
          onDelta('Done.');
          return {
            text: 'Done.',
            conversationId: 'backend-conv-1',
            confirmation: null,
          };
        },
      );
      const messageId = result.current.activeConversation!.messages[1].id;

      await act(async () => {
        await result.current.answerConfirmation(messageId, true);
      });

      expect(mockConfirmChatActions).toHaveBeenCalledWith(
        'c-1',
        true,
        'backend-conv-1',
        { onDelta: expect.any(Function), onActivity: expect.any(Function) },
      );
      const assistantMessage = result.current.activeConversation!.messages[1];
      expect(assistantMessage.content).toBe('Done.');
      expect(assistantMessage.pendingConfirmation).toBeUndefined();
      expect(assistantMessage.status).toBe('complete');
    });

    it('does nothing when there is no pending confirmation', async () => {
      mockStreamChatMessage.mockResolvedValue({
        text: 'hi',
        conversationId: 'backend-conv-1',
        confirmation: null,
      });
      const { result } = renderHook(() => useAiChat());
      await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled());
      await act(async () => {
        await Promise.resolve();
      });
      await act(async () => {
        await result.current.sendMessage('hi');
      });

      await act(async () => {
        await result.current.answerConfirmation(
          result.current.activeConversation!.messages[1].id,
          true,
        );
      });

      expect(mockConfirmChatActions).not.toHaveBeenCalled();
    });
  });
  describe('activities', () => {
    const activity = (
      id: string,
      kind: 'model' | 'thinking' | 'tool' | 'retry',
      state: 'started' | 'finished',
    ) => ({ id, kind, state });

    const setup = async () => {
      const hook = renderHook(() => useAiChat());
      await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled());
      await act(async () => {
        await Promise.resolve();
      });
      return hook;
    };

    it('keeps every event in arrival order, updates a finished one in place and clears all when the reply is complete', async () => {
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      mockStreamChatMessage.mockImplementation(
        async (_content, _conversationId, { onDelta, onActivity }) => {
          onActivity(activity('m1', 'model', 'started'));
          onActivity(activity('t1', 'tool', 'started'));
          onActivity(activity('m1', 'model', 'finished'));
          await gate;
          onDelta('answer');
          return { text: 'answer', conversationId: 'c', confirmation: null };
        },
      );
      const { result } = await setup();

      let sending: Promise<void> = Promise.resolve();
      act(() => {
        sending = result.current.sendMessage('hi');
      });
      await waitFor(() => expect(result.current.activities).toHaveLength(2));
      expect(result.current.activities.map((a) => [a.id, a.state])).toEqual([
        ['m1', 'finished'],
        ['t1', 'started'],
      ]);
      expect(result.current.isStreaming).toBe(true);

      await act(async () => {
        release();
        await sending;
      });

      expect(result.current.activities).toEqual([]);
      expect(result.current.isStreaming).toBe(false);
      // activities are transient: nothing about them ends up in the stored conversation
      expect(JSON.stringify(result.current.activeConversation)).not.toContain(
        '"tool"',
      );
    });

    it('clears the activities when the stream fails', async () => {
      mockStreamChatMessage.mockImplementation(
        async (_content, _conversationId, { onActivity }) => {
          onActivity(activity('m1', 'model', 'started'));
          throw new Error('AI_CHAT_BACKEND_ERROR: provider_error');
        },
      );
      const { result } = await setup();

      await act(async () => {
        await result.current.sendMessage('hi');
      });

      expect(result.current.activities).toEqual([]);
      expect(result.current.error).toContain('provider_error');
    });

    it('does not duplicate a line that is started twice', async () => {
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      mockStreamChatMessage.mockImplementation(
        async (_content, _conversationId, { onActivity }) => {
          onActivity(activity('r1', 'retry', 'started'));
          onActivity(activity('r1', 'retry', 'started'));
          await gate;
          return { text: '', conversationId: 'c', confirmation: null };
        },
      );
      const { result } = await setup();
      let sending: Promise<void> = Promise.resolve();
      act(() => {
        sending = result.current.sendMessage('hi');
      });
      await waitFor(() => expect(result.current.activities).toHaveLength(1));
      await act(async () => {
        release();
        await sending;
      });
    });
  });
});
