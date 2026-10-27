import {
  confirmChatActions,
  streamChatMessage,
  type AiChatActivity,
  type AiChatStreamHandlers,
  type AiChatStreamResult,
} from '@bahmni/services';
import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAiChatStore } from './aiChatStore';
import type { AiChatMessage, AiConversation } from './models';
import { useAiConversations } from './useAiConversations';

interface UseAiChatResult {
  activeConversation: AiConversation | null;
  isStreaming: boolean;
  /** The events of the reply being produced, in arrival order; empty when nothing is running. Never persisted. */
  activities: AiChatActivity[];
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  /** Approve or reject the actions the assistant is waiting on for `messageId`. */
  answerConfirmation: (messageId: string, approved: boolean) => Promise<void>;
}

/** Owns the send-message flow: optimistic user message, streamed assistant reply. */
export function useAiChat(): UseAiChatResult {
  const { userId, activeConversation, startNewConversation } =
    useAiConversations();
  const appendMessage = useAiChatStore((state) => state.appendMessage);
  const updateMessageContent = useAiChatStore(
    (state) => state.updateMessageContent,
  );
  const setMessageStatus = useAiChatStore((state) => state.setMessageStatus);
  const setPendingConfirmation = useAiChatStore(
    (state) => state.setPendingConfirmation,
  );
  const setBackendConversationId = useAiChatStore(
    (state) => state.setBackendConversationId,
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<AiChatActivity[]>([]);

  /** Every event stays visible as it arrives (a `finished` updates its line in place). All are cleared when the exchange ends. */
  const handleActivity = useCallback((activity: AiChatActivity) => {
    setActivities((current) =>
      current.some((line) => line.id === activity.id)
        ? current.map((line) =>
            line.id === activity.id ? { ...line, ...activity } : line,
          )
        : [...current, activity],
    );
  }, []);

  /** Runs one streamed exchange into an assistant message and records the outcome. */
  const runExchange = useCallback(
    async (
      conversation: AiConversation,
      assistantMessageId: string,
      exchange: (handlers: AiChatStreamHandlers) => Promise<AiChatStreamResult>,
    ) => {
      if (!userId) return;
      setIsStreaming(true);
      setActivities([]);
      try {
        const result = await exchange({
          onDelta: (delta) =>
            updateMessageContent(
              userId,
              conversation.id,
              assistantMessageId,
              delta,
            ),
          onActivity: handleActivity,
        });

        if (result.conversationId && !conversation.backendConversationId) {
          setBackendConversationId(
            userId,
            conversation.id,
            result.conversationId,
          );
        }
        setPendingConfirmation(
          userId,
          conversation.id,
          assistantMessageId,
          result.confirmation ?? undefined,
        );
        setMessageStatus(
          userId,
          conversation.id,
          assistantMessageId,
          'complete',
        );
      } catch (err) {
        setMessageStatus(userId, conversation.id, assistantMessageId, 'error');
        setError(err instanceof Error ? err.message : 'AI_CHAT_UNKNOWN_ERROR');
      } finally {
        // The reply is complete (or failed, or waits for approval): the progress lines have served their purpose.
        setActivities([]);
        setIsStreaming(false);
      }
    },
    [
      handleActivity,
      userId,
      updateMessageContent,
      setBackendConversationId,
      setPendingConfirmation,
      setMessageStatus,
    ],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !userId) return;

      const conversation = activeConversation ?? startNewConversation();
      if (!conversation) return;

      setError(null);

      const userMessage: AiChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
        status: 'complete',
      };
      appendMessage(userId, conversation.id, userMessage);

      const assistantMessageId = uuidv4();
      appendMessage(userId, conversation.id, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'pending',
      });

      await runExchange(conversation, assistantMessageId, (handlers) =>
        streamChatMessage(
          trimmed,
          conversation.backendConversationId ?? null,
          handlers,
        ),
      );
    },
    [
      userId,
      activeConversation,
      startNewConversation,
      appendMessage,
      runExchange,
    ],
  );

  const answerConfirmation = useCallback(
    async (messageId: string, approved: boolean) => {
      if (!userId || !activeConversation) return;
      const pending = activeConversation.messages.find(
        (message) => message.id === messageId,
      )?.pendingConfirmation;
      if (!pending) return;

      setError(null);
      // Clear first so the buttons cannot be pressed twice: a confirmation is
      // single-use on the server.
      setPendingConfirmation(
        userId,
        activeConversation.id,
        messageId,
        undefined,
      );
      // Back to "waiting for the assistant" until the next event arrives.
      setMessageStatus(userId, activeConversation.id, messageId, 'pending');
      await runExchange(activeConversation, messageId, (handlers) =>
        confirmChatActions(
          pending.confirmationId,
          approved,
          activeConversation.backendConversationId ?? null,
          handlers,
        ),
      );
    },
    [
      userId,
      activeConversation,
      setPendingConfirmation,
      setMessageStatus,
      runExchange,
    ],
  );

  return {
    activeConversation,
    isStreaming,
    activities,
    error,
    sendMessage,
    answerConfirmation,
  };
}
