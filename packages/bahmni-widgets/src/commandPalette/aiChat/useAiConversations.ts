import {
  deleteAiConversation,
  getAiConversation,
  listAiConversations,
  type AiTranscriptMessage,
} from '@bahmni/services';
import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAiChatStore } from './aiChatStore';
import type { AiChatMessage, AiConversation } from './models';
import { useCurrentUserId } from './useCurrentUserId';

interface AiConversationsState {
  userId: string | null;
  userLoading: boolean;
  conversations: AiConversation[];
  activeConversation: AiConversation | null;
  isExpanded: boolean;
  startNewConversation: () => AiConversation | null;
  /** True while the conversation list or a transcript is being fetched from the server. */
  isLoading: boolean;
  /** Last failed history call (message from the service), cleared by the next call. */
  historyError: string | null;
  refreshConversations: () => Promise<void>;
  switchConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  setExpanded: (expanded: boolean) => void;
}

const toChatMessage = (
  message: AiTranscriptMessage,
  fallbackDate: string,
): AiChatMessage => ({
  id: uuidv4(),
  role: message.role,
  content: message.text,
  createdAt: message.timestamp ?? fallbackDate,
  status: 'complete',
});

/**
 * Conversations of the logged-in user. History lives on the server: the store
 * only holds what is on screen, filled from the list/transcript endpoints.
 */
export function useAiConversations(): AiConversationsState {
  const { userId, loading: userLoading } = useCurrentUserId();
  const conversationsByUser = useAiChatStore(
    (state) => state.conversationsByUser,
  );
  const activeConversationId = useAiChatStore(
    (state) => state.activeConversationId,
  );
  const isExpanded = useAiChatStore((state) => state.isExpanded);
  const startNewConversationAction = useAiChatStore(
    (state) => state.startNewConversation,
  );
  const setActiveConversation = useAiChatStore(
    (state) => state.setActiveConversation,
  );
  const deleteConversationAction = useAiChatStore(
    (state) => state.deleteConversation,
  );
  const setExpandedAction = useAiChatStore((state) => state.setExpanded);
  const setConversationList = useAiChatStore(
    (state) => state.setConversationList,
  );
  const setConversationMessages = useAiChatStore(
    (state) => state.setConversationMessages,
  );
  const [pending, setPending] = useState(0);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const conversations = useMemo(
    () => (userId ? (conversationsByUser[userId] ?? []) : []),
    [conversationsByUser, userId],
  );

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [conversations, activeConversationId],
  );

  const track = useCallback(async (work: () => Promise<void>) => {
    setPending((count) => count + 1);
    setHistoryError(null);
    try {
      await work();
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : 'AI_CHAT_UNKNOWN_ERROR',
      );
    } finally {
      setPending((count) => count - 1);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    await track(async () =>
      setConversationList(userId, await listAiConversations()),
    );
  }, [userId, track, setConversationList]);

  const switchConversation = useCallback(
    async (conversationId: string) => {
      setActiveConversation(conversationId);
      const target = conversations.find((c) => c.id === conversationId);
      if (!userId || !target?.backendConversationId || target.messagesLoaded) {
        return;
      }
      const backendId = target.backendConversationId;
      await track(async () => {
        const transcript = await getAiConversation(backendId);
        setConversationMessages(
          userId,
          conversationId,
          transcript.messages.map((m) =>
            toChatMessage(m, transcript.updatedAt),
          ),
        );
      });
    },
    [
      userId,
      conversations,
      setActiveConversation,
      setConversationMessages,
      track,
    ],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!userId) return;
      const target = conversations.find((c) => c.id === conversationId);
      await track(async () => {
        // Unsent drafts only exist in memory; anything else is deleted on the server first.
        if (target?.backendConversationId) {
          await deleteAiConversation(target.backendConversationId);
        }
        deleteConversationAction(userId, conversationId);
      });
    },
    [userId, conversations, deleteConversationAction, track],
  );

  return {
    userId,
    userLoading,
    conversations,
    activeConversation,
    isExpanded,
    startNewConversation: () =>
      userId ? startNewConversationAction(userId) : null,
    isLoading: pending > 0,
    historyError,
    refreshConversations,
    switchConversation,
    deleteConversation,
    setExpanded: setExpandedAction,
  };
}
