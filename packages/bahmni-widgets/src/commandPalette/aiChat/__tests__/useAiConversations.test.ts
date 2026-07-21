import {
  deleteAiConversation,
  getAiConversation,
  getCurrentUser,
  listAiConversations,
} from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useAiChatStore } from '../aiChatStore';
import { useAiConversations } from '../useAiConversations';

jest.mock('@bahmni/services', () => ({
  getCurrentUser: jest.fn(),
  listAiConversations: jest.fn(),
  getAiConversation: jest.fn(),
  deleteAiConversation: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockList = listAiConversations as jest.Mock;
const mockGet = getAiConversation as jest.Mock;
const mockDelete = deleteAiConversation as jest.Mock;

describe('useAiConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockList.mockResolvedValue([]);
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

  it('lists conversations only for the current user', async () => {
    useAiChatStore.getState().startNewConversation('user-1');
    useAiChatStore.getState().startNewConversation('user-2');

    const { result } = renderHook(() => useAiConversations());

    await waitFor(() => expect(result.current.userLoading).toBe(false));
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].userId).toBe('user-1');
  });

  it('creates a new conversation for the current user', async () => {
    const { result } = renderHook(() => useAiConversations());
    await waitFor(() => expect(result.current.userLoading).toBe(false));

    let conversation;
    act(() => {
      conversation = result.current.startNewConversation();
    });

    expect(conversation?.userId).toBe('user-1');
  });

  it('returns null from startNewConversation when there is no logged-in user', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const { result } = renderHook(() => useAiConversations());
    await waitFor(() => expect(result.current.userLoading).toBe(false));

    expect(result.current.startNewConversation()).toBeNull();
  });

  it('loads the list from the server and keeps nothing in localStorage', async () => {
    mockList.mockResolvedValue([
      { id: 'b1', title: 'First', createdAt: 't1', updatedAt: 't2' },
    ]);
    const { result } = renderHook(() => useAiConversations());
    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.refreshConversations();
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0]).toMatchObject({
      backendConversationId: 'b1',
      title: 'First',
      messagesLoaded: false,
    });
    expect(localStorage.getItem('bahmni_ai_chat_conversations')).toBeNull();
    expect(Object.values(localStorage).join(' ').includes('First')).toBe(false);
  });

  it('fetches the transcript when a server conversation is opened', async () => {
    mockList.mockResolvedValue([
      { id: 'b1', title: 'First', createdAt: 't1', updatedAt: 't2' },
    ]);
    mockGet.mockResolvedValue({
      id: 'b1',
      title: 'First',
      createdAt: 't1',
      updatedAt: 't2',
      messages: [
        { role: 'user', text: 'hello', timestamp: 't1' },
        { role: 'assistant', text: 'hi', timestamp: null },
      ],
    });
    const { result } = renderHook(() => useAiConversations());
    await waitFor(() => expect(result.current.userLoading).toBe(false));
    await act(async () => {
      await result.current.refreshConversations();
    });

    await act(async () => {
      await result.current.switchConversation(
        result.current.conversations[0].id,
      );
    });

    expect(mockGet).toHaveBeenCalledWith('b1');
    expect(result.current.activeConversation?.messages).toMatchObject([
      { role: 'user', content: 'hello', createdAt: 't1' },
      { role: 'assistant', content: 'hi', createdAt: 't2' },
    ]);
  });

  it('does not refetch a transcript that is already on screen', async () => {
    const conversation = useAiChatStore
      .getState()
      .startNewConversation('user-1'); // a draft: nothing on the server
    const { result } = renderHook(() => useAiConversations());
    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.switchConversation(conversation.id);
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(useAiChatStore.getState().activeConversationId).toBe(
      conversation.id,
    );
  });

  it('deletes on the server first and drops drafts locally without a call', async () => {
    mockList.mockResolvedValue([
      { id: 'b1', title: 'First', createdAt: 't1', updatedAt: 't2' },
    ]);
    mockDelete.mockResolvedValue(undefined);
    const draft = useAiChatStore.getState().startNewConversation('user-1');
    const { result } = renderHook(() => useAiConversations());
    await waitFor(() => expect(result.current.userLoading).toBe(false));
    await act(async () => {
      await result.current.refreshConversations();
    });
    const server = result.current.conversations.find(
      (c) => c.backendConversationId === 'b1',
    );

    await act(async () => {
      await result.current.deleteConversation(server!.id);
      await result.current.deleteConversation(draft.id);
    });

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('b1');
    expect(result.current.conversations).toHaveLength(0);
  });

  it('keeps the conversation and reports the error when the server delete fails', async () => {
    mockList.mockResolvedValue([
      { id: 'b1', title: 'First', createdAt: 't1', updatedAt: 't2' },
    ]);
    mockDelete.mockRejectedValue(new Error('AI_CHAT_REQUEST_FAILED: 502'));
    const { result } = renderHook(() => useAiConversations());
    await waitFor(() => expect(result.current.userLoading).toBe(false));
    await act(async () => {
      await result.current.refreshConversations();
    });

    await act(async () => {
      await result.current.deleteConversation(
        result.current.conversations[0].id,
      );
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.historyError).toBe('AI_CHAT_REQUEST_FAILED: 502');
  });
});
