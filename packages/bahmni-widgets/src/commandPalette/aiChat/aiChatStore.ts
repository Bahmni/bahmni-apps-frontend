import type { AiConversationSummary } from '@bahmni/services';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AiChatMessage,
  AiChatMessageStatus,
  AiChatPendingConfirmation,
  AiConversation,
} from './models';

// Only a UI preference is kept in the browser. Conversations live on the server (bahmni-ai).
const AI_CHAT_PREFERENCES_STORAGE_KEY = 'bahmni_ai_chat_preferences';
const CONVERSATION_TITLE_MAX_LENGTH = 60;

interface AiChatState {
  conversationsByUser: Record<string, AiConversation[]>;
  activeConversationId: string | null;
  isExpanded: boolean;

  startNewConversation: (userId: string) => AiConversation;
  appendMessage: (
    userId: string,
    conversationId: string,
    message: AiChatMessage,
  ) => void;
  updateMessageContent: (
    userId: string,
    conversationId: string,
    messageId: string,
    contentDelta: string,
  ) => void;
  setMessageStatus: (
    userId: string,
    conversationId: string,
    messageId: string,
    status: AiChatMessageStatus,
  ) => void;
  setPendingConfirmation: (
    userId: string,
    conversationId: string,
    messageId: string,
    pendingConfirmation: AiChatPendingConfirmation | undefined,
  ) => void;
  setBackendConversationId: (
    userId: string,
    conversationId: string,
    backendConversationId: string,
  ) => void;
  /** Replaces the server-backed conversations with `summaries`; unsent drafts and loaded messages are kept. */
  setConversationList: (
    userId: string,
    summaries: AiConversationSummary[],
  ) => void;
  setConversationMessages: (
    userId: string,
    conversationId: string,
    messages: AiChatMessage[],
  ) => void;
  setActiveConversation: (conversationId: string | null) => void;
  deleteConversation: (userId: string, conversationId: string) => void;
  setExpanded: (expanded: boolean) => void;
}

const truncateTitle = (text: string): string =>
  text.length > CONVERSATION_TITLE_MAX_LENGTH
    ? `${text.slice(0, CONVERSATION_TITLE_MAX_LENGTH).trimEnd()}…`
    : text;

const updateConversation = (
  conversations: AiConversation[],
  conversationId: string,
  updater: (conversation: AiConversation) => AiConversation,
): AiConversation[] =>
  conversations.map((conversation) =>
    conversation.id === conversationId ? updater(conversation) : conversation,
  );

export const useAiChatStore = create<AiChatState>()(
  persist(
    (set, get) => ({
      conversationsByUser: {},
      activeConversationId: null,
      isExpanded: false,

      startNewConversation: (userId) => {
        const now = new Date().toISOString();
        const conversation: AiConversation = {
          id: uuidv4(),
          userId,
          title: '',
          messages: [],
          messagesLoaded: true,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          conversationsByUser: {
            ...state.conversationsByUser,
            [userId]: [
              conversation,
              ...(state.conversationsByUser[userId] ?? []),
            ],
          },
          activeConversationId: conversation.id,
        }));

        return conversation;
      },

      appendMessage: (userId, conversationId, message) => {
        set((state) => {
          const userConversations = state.conversationsByUser[userId] ?? [];
          return {
            conversationsByUser: {
              ...state.conversationsByUser,
              [userId]: updateConversation(
                userConversations,
                conversationId,
                (conversation) => ({
                  ...conversation,
                  title:
                    conversation.title ||
                    (message.role === 'user'
                      ? truncateTitle(message.content)
                      : conversation.title),
                  messages: [...conversation.messages, message],
                  updatedAt: message.createdAt,
                }),
              ),
            },
          };
        });
      },

      updateMessageContent: (
        userId,
        conversationId,
        messageId,
        contentDelta,
      ) => {
        set((state) => {
          const userConversations = state.conversationsByUser[userId] ?? [];
          return {
            conversationsByUser: {
              ...state.conversationsByUser,
              [userId]: updateConversation(
                userConversations,
                conversationId,
                (conversation) => ({
                  ...conversation,
                  messages: conversation.messages.map((msg) =>
                    msg.id === messageId
                      ? {
                          ...msg,
                          content: msg.content + contentDelta,
                          status: 'streaming' as const,
                        }
                      : msg,
                  ),
                }),
              ),
            },
          };
        });
      },

      setMessageStatus: (userId, conversationId, messageId, status) => {
        set((state) => {
          const userConversations = state.conversationsByUser[userId] ?? [];
          return {
            conversationsByUser: {
              ...state.conversationsByUser,
              [userId]: updateConversation(
                userConversations,
                conversationId,
                (conversation) => ({
                  ...conversation,
                  messages: conversation.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, status } : msg,
                  ),
                }),
              ),
            },
          };
        });
      },

      setPendingConfirmation: (
        userId,
        conversationId,
        messageId,
        pendingConfirmation,
      ) => {
        set((state) => {
          const userConversations = state.conversationsByUser[userId] ?? [];
          return {
            conversationsByUser: {
              ...state.conversationsByUser,
              [userId]: updateConversation(
                userConversations,
                conversationId,
                (conversation) => ({
                  ...conversation,
                  messages: conversation.messages.map((msg) =>
                    msg.id === messageId
                      ? { ...msg, pendingConfirmation }
                      : msg,
                  ),
                }),
              ),
            },
          };
        });
      },

      setBackendConversationId: (
        userId,
        conversationId,
        backendConversationId,
      ) => {
        set((state) => {
          const userConversations = state.conversationsByUser[userId] ?? [];
          return {
            conversationsByUser: {
              ...state.conversationsByUser,
              [userId]: updateConversation(
                userConversations,
                conversationId,
                (conversation) => ({ ...conversation, backendConversationId }),
              ),
            },
          };
        });
      },

      setConversationList: (userId, summaries) => {
        set((state) => {
          const existing = state.conversationsByUser[userId] ?? [];
          const byBackendId = new Map(
            existing
              .filter((c) => c.backendConversationId)
              .map((c) => [c.backendConversationId, c]),
          );
          const fromServer = summaries.map((summary): AiConversation => {
            const local = byBackendId.get(summary.id);
            return {
              // Keep the local id so an open conversation stays selected.
              id: local?.id ?? summary.id,
              userId,
              backendConversationId: summary.id,
              // An empty server title is "no title yet", so fall back on empty string too.
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              title: summary.title || local?.title || '',
              messages: local?.messages ?? [],
              messagesLoaded: local?.messagesLoaded ?? false,
              createdAt: summary.createdAt,
              updatedAt: local?.updatedAt ?? summary.updatedAt,
            };
          });
          const listed = new Set(summaries.map((item) => item.id));
          // Unsent drafts stay; so does the open conversation if the list is momentarily behind it.
          const kept = existing.filter(
            (c) =>
              !c.backendConversationId ||
              (c.id === state.activeConversationId &&
                !listed.has(c.backendConversationId)),
          );
          const conversationsList = [...kept, ...fromServer];
          const active = state.activeConversationId;
          return {
            conversationsByUser: {
              ...state.conversationsByUser,
              [userId]: conversationsList,
            },
            activeConversationId: conversationsList.some((c) => c.id === active)
              ? active
              : null,
          };
        });
      },

      setConversationMessages: (userId, conversationId, messages) => {
        set((state) => ({
          conversationsByUser: {
            ...state.conversationsByUser,
            [userId]: updateConversation(
              state.conversationsByUser[userId] ?? [],
              conversationId,
              (conversation) => ({
                ...conversation,
                messages,
                messagesLoaded: true,
              }),
            ),
          },
        }));
      },

      setActiveConversation: (conversationId) =>
        set({ activeConversationId: conversationId }),

      deleteConversation: (userId, conversationId) => {
        set((state) => {
          const userConversations = state.conversationsByUser[userId] ?? [];
          const remaining = userConversations.filter(
            (c) => c.id !== conversationId,
          );
          const wasActive = get().activeConversationId === conversationId;
          return {
            conversationsByUser: {
              ...state.conversationsByUser,
              [userId]: remaining,
            },
            activeConversationId: wasActive ? null : state.activeConversationId,
          };
        });
      },

      setExpanded: (expanded) => set({ isExpanded: expanded }),
    }),
    {
      name: AI_CHAT_PREFERENCES_STORAGE_KEY,
      partialize: (state) => ({ isExpanded: state.isExpanded }),
    },
  ),
);
