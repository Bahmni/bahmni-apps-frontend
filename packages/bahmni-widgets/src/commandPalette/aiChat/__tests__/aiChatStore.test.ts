import { useAiChatStore } from '../aiChatStore';
import type { AiChatMessage } from '../models';

const USER_A = 'user-a';
const USER_B = 'user-b';

const makeMessage = (
  overrides: Partial<AiChatMessage> = {},
): AiChatMessage => ({
  id: 'msg-1',
  role: 'user',
  content: 'hello',
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'complete',
  ...overrides,
});

describe('aiChatStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAiChatStore.setState({
      conversationsByUser: {},
      activeConversationId: null,
      isExpanded: false,
    });
  });

  it('starts a new conversation for a user and makes it active', () => {
    const conversation = useAiChatStore.getState().startNewConversation(USER_A);

    expect(conversation.userId).toBe(USER_A);
    expect(conversation.messages).toEqual([]);
    expect(useAiChatStore.getState().activeConversationId).toBe(
      conversation.id,
    );
    expect(useAiChatStore.getState().conversationsByUser[USER_A]).toHaveLength(
      1,
    );
  });

  it('does not leak conversations between users', () => {
    useAiChatStore.getState().startNewConversation(USER_A);
    useAiChatStore.getState().startNewConversation(USER_B);

    expect(useAiChatStore.getState().conversationsByUser[USER_A]).toHaveLength(
      1,
    );
    expect(useAiChatStore.getState().conversationsByUser[USER_B]).toHaveLength(
      1,
    );
  });

  it('appends a message and derives the conversation title from the first user message', () => {
    const conversation = useAiChatStore.getState().startNewConversation(USER_A);
    useAiChatStore
      .getState()
      .appendMessage(USER_A, conversation.id, makeMessage());

    const updated = useAiChatStore.getState().conversationsByUser[USER_A][0];
    expect(updated.messages).toHaveLength(1);
    expect(updated.title).toBe('hello');
  });

  it('truncates long titles', () => {
    const conversation = useAiChatStore.getState().startNewConversation(USER_A);
    const longText = 'a'.repeat(100);
    useAiChatStore
      .getState()
      .appendMessage(
        USER_A,
        conversation.id,
        makeMessage({ content: longText }),
      );

    const updated = useAiChatStore.getState().conversationsByUser[USER_A][0];
    expect(updated.title.length).toBeLessThan(longText.length);
    expect(updated.title.endsWith('…')).toBe(true);
  });

  it('streams content into a message via updateMessageContent', () => {
    const conversation = useAiChatStore.getState().startNewConversation(USER_A);
    useAiChatStore
      .getState()
      .appendMessage(
        USER_A,
        conversation.id,
        makeMessage({ id: 'assistant-1', role: 'assistant', content: '' }),
      );

    useAiChatStore
      .getState()
      .updateMessageContent(USER_A, conversation.id, 'assistant-1', 'Hel');
    useAiChatStore
      .getState()
      .updateMessageContent(USER_A, conversation.id, 'assistant-1', 'lo');

    const message =
      useAiChatStore.getState().conversationsByUser[USER_A][0].messages[0];
    expect(message.content).toBe('Hello');
    expect(message.status).toBe('streaming');
  });

  it('sets a message status', () => {
    const conversation = useAiChatStore.getState().startNewConversation(USER_A);
    useAiChatStore
      .getState()
      .appendMessage(
        USER_A,
        conversation.id,
        makeMessage({ id: 'assistant-1' }),
      );

    useAiChatStore
      .getState()
      .setMessageStatus(USER_A, conversation.id, 'assistant-1', 'error');

    const message =
      useAiChatStore.getState().conversationsByUser[USER_A][0].messages[0];
    expect(message.status).toBe('error');
  });

  it('deletes a conversation and clears activeConversationId if it was active', () => {
    const conversation = useAiChatStore.getState().startNewConversation(USER_A);

    useAiChatStore.getState().deleteConversation(USER_A, conversation.id);

    expect(useAiChatStore.getState().conversationsByUser[USER_A]).toHaveLength(
      0,
    );
    expect(useAiChatStore.getState().activeConversationId).toBeNull();
  });

  it('sets the backend conversation id on a conversation', () => {
    const conversation = useAiChatStore.getState().startNewConversation(USER_A);

    useAiChatStore
      .getState()
      .setBackendConversationId(USER_A, conversation.id, 'backend-conv-1');

    const updated = useAiChatStore.getState().conversationsByUser[USER_A][0];
    expect(updated.backendConversationId).toBe('backend-conv-1');
  });

  it('toggles expanded state', () => {
    useAiChatStore.getState().setExpanded(true);
    expect(useAiChatStore.getState().isExpanded).toBe(true);
  });

  it('merges the server list, keeping drafts and the open conversation', () => {
    const draft = useAiChatStore.getState().startNewConversation(USER_A);
    useAiChatStore
      .getState()
      .setConversationList(USER_A, [
        { id: 'b1', title: 'One', createdAt: 't1', updatedAt: 't2' },
      ]);
    let list = useAiChatStore.getState().conversationsByUser[USER_A];
    expect(list.map((c) => c.id)).toEqual([draft.id, 'b1']);

    // The draft got its server id after the first reply: the list must not duplicate it.
    useAiChatStore.getState().setBackendConversationId(USER_A, draft.id, 'b2');
    useAiChatStore
      .getState()
      .setConversationList(USER_A, [
        { id: 'b2', title: 'Two', createdAt: 't1', updatedAt: 't3' },
      ]);
    list = useAiChatStore.getState().conversationsByUser[USER_A];
    expect(list.map((c) => c.id)).toEqual([draft.id]);
    expect(useAiChatStore.getState().activeConversationId).toBe(draft.id);
    expect(list[0]).toMatchObject({
      backendConversationId: 'b2',
      title: 'Two',
    });
  });

  it('drops a closed conversation the server no longer lists', () => {
    useAiChatStore
      .getState()
      .setConversationList(USER_A, [
        { id: 'b1', title: 'One', createdAt: 't1', updatedAt: 't2' },
      ]);
    useAiChatStore.getState().setConversationList(USER_A, []);

    expect(useAiChatStore.getState().conversationsByUser[USER_A]).toEqual([]);
  });

  it('stores no conversation content in localStorage, only the layout preference', () => {
    const conversation = useAiChatStore.getState().startNewConversation(USER_A);
    useAiChatStore
      .getState()
      .appendMessage(
        USER_A,
        conversation.id,
        makeMessage({ content: 'patient secret' }),
      );
    useAiChatStore.getState().setExpanded(true);

    const stored = Object.values(localStorage).join(' ');
    expect(stored).not.toContain('patient secret');
    expect(stored).toContain('isExpanded');
  });
});
