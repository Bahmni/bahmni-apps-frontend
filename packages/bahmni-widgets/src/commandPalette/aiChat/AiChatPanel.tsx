import {
  Add,
  ArrowLeft,
  Maximize,
  MagicWand,
  Minimize,
  SendAlt,
} from '@carbon/icons-react';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiActivityList } from './AiActivityList';
import { AiConfirmationCard } from './AiConfirmationCard';
import { AiConversationSidebar } from './AiConversationSidebar';
import styles from './styles/AiChat.module.scss';
import { useAiChat } from './useAiChat';
import { useAiConversations } from './useAiConversations';

interface AiChatPanelProps {
  onBack: () => void;
  initialQuery?: string;
}

/** Maps a service error to a translation key; see aiChatService for the formats. */
const errorKey = (error: string): string => {
  if (error.includes(' 401') || error.includes('session_expired'))
    return 'COMMAND_PALETTE_AI_CHAT_ERROR_SESSION';
  if (error.includes(' 403')) return 'COMMAND_PALETTE_AI_CHAT_ERROR_FORBIDDEN';
  if (error.includes(' 502') || error.includes(' 503'))
    return 'COMMAND_PALETTE_AI_CHAT_ERROR_UNAVAILABLE';
  return 'COMMAND_PALETTE_AI_CHAT_ERROR';
};

export const AiChatPanel: React.FC<AiChatPanelProps> = ({
  onBack,
  initialQuery,
}) => {
  const { t } = useTranslation('command-palette');
  const {
    activeConversation,
    isStreaming,
    activities,
    error,
    sendMessage,
    answerConfirmation,
  } = useAiChat();
  const {
    userId,
    conversations,
    isLoading,
    historyError,
    refreshConversations,
    isExpanded,
    setExpanded,
    startNewConversation,
    switchConversation,
    deleteConversation,
  } = useAiConversations();

  const [draft, setDraft] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);
  const hasSeededInitialQuery = useRef(false);

  useEffect(() => {
    // History lives on the server: fetch it when the panel opens (once the user is known).
    void refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    // Wait for the current user to resolve, or sendMessage would drop the query.
    if (!initialQuery || hasSeededInitialQuery.current || !userId) return;
    hasSeededInitialQuery.current = true;
    void sendMessage(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const thread = threadRef.current;
    // scrollTo isn't implemented in jsdom (test env); real browsers have it.
    // `behavior: 'instant'` overrides the `.thread { scroll-behavior: smooth }`
    // CSS so each streamed delta pins the view to the bottom immediately. With
    // smooth scrolling the animation is restarted on every chunk and never
    // catches up, so the thread appears not to auto-scroll while streaming.
    thread?.scrollTo?.({ top: thread.scrollHeight, behavior: 'instant' });
  }, [activeConversation?.messages]);

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!draft.trim() || isStreaming) return;
    void sendMessage(draft);
    setDraft('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      handleSubmit(event);
    }
  };

  const handleNewChat = () => {
    startNewConversation();
    setDraft('');
  };

  const messages = activeConversation?.messages ?? [];
  const lastMessageId = messages.at(-1)?.id;
  // A brand-new conversation has title === '' (not undefined) until the first
  // message sets it, so this needs to fall back on empty string too - ?? only
  // catches null/undefined, which would leave the header blank in that state.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const headerTitle = activeConversation?.title
    ? activeConversation.title
    : t('COMMAND_PALETTE_AI_CHAT_ITEM_LABEL');

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.headerButton}
          aria-label={t('COMMAND_PALETTE_AI_CHAT_BACK')}
          onClick={onBack}
        >
          <ArrowLeft size={16} />
        </button>
        <span className={styles.headerTitle}>{headerTitle}</span>
        <button
          type="button"
          className={styles.headerButton}
          aria-label={t('COMMAND_PALETTE_AI_CHAT_NEW_CHAT')}
          onClick={handleNewChat}
        >
          <Add size={16} />
        </button>
        <button
          type="button"
          className={styles.headerButton}
          aria-label={
            isExpanded
              ? t('COMMAND_PALETTE_AI_CHAT_COLLAPSE')
              : t('COMMAND_PALETTE_AI_CHAT_EXPAND')
          }
          onClick={() => setExpanded(!isExpanded)}
        >
          {isExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      <div className={styles.body}>
        {isExpanded && (
          <AiConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversation?.id ?? null}
            onSelect={switchConversation}
            onDelete={deleteConversation}
          />
        )}

        <div className={styles.panel}>
          <div className={styles.thread} ref={threadRef}>
            {messages.length === 0 && (
              <div className={styles.emptyThread}>
                <span className={styles.emptyIcon} aria-hidden="true">
                  <MagicWand size={24} />
                </span>
                <p>{t('COMMAND_PALETTE_AI_CHAT_EMPTY_THREAD')}</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${
                  message.role === 'user'
                    ? styles.messageRowUser
                    : styles.messageRowAssistant
                }`}
              >
                {message.role === 'assistant' && (
                  <span className={styles.avatar} aria-hidden="true">
                    <MagicWand size={14} />
                  </span>
                )}
                <div
                  className={`${styles.bubble} ${
                    message.status === 'error'
                      ? styles.bubbleError
                      : message.role === 'user'
                        ? styles.bubbleUser
                        : styles.bubbleAssistant
                  }`}
                >
                  {message.status === 'pending' && (
                    <span
                      className={styles.typingIndicator}
                      role="status"
                      aria-label={t('COMMAND_PALETTE_AI_CHAT_THINKING')}
                    >
                      <svg
                        className={styles.ekgLine}
                        viewBox="0 0 80 20"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          className={styles.ekgPath}
                          d="M 0,10 L 12,10 L 14,8 L 16,10 L 20,10 L 22,2 L 25,18 L 28,10 L 36,10 L 39,5 L 42,10 L 52,10 L 54,8 L 56,10 L 60,10 L 62,2 L 65,18 L 68,10 L 76,10 L 79,5 L 80,8"
                        />
                      </svg>
                    </span>
                  )}
                  {isStreaming && message.id === lastMessageId && (
                    <AiActivityList activities={activities} />
                  )}
                  {message.role === 'assistant' ? (
                    <div className={styles.markdown}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className={styles.plainText}>{message.content}</span>
                  )}
                  {message.pendingConfirmation && (
                    <AiConfirmationCard
                      confirmation={message.pendingConfirmation}
                      disabled={isStreaming}
                      onApprove={() =>
                        void answerConfirmation(message.id, true)
                      }
                      onReject={() =>
                        void answerConfirmation(message.id, false)
                      }
                    />
                  )}
                  {message.status === 'streaming' && (
                    <span
                      className={styles.streamingCursor}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages.length === 0 && (
              <p className={styles.emptyThread} role="status">
                {t('COMMAND_PALETTE_AI_CHAT_HISTORY_LOADING')}
              </p>
            )}

            {(error ?? historyError) && (
              <p className={styles.emptyThread}>
                {t(errorKey((error ?? historyError) as string))}
              </p>
            )}
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            <textarea
              className={styles.composerInput}
              placeholder={t('COMMAND_PALETTE_AI_CHAT_PLACEHOLDER')}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              autoFocus
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!draft.trim() || isStreaming}
            >
              <SendAlt size={16} aria-hidden="true" />
              <span className={styles.srOnly}>
                {t('COMMAND_PALETTE_AI_CHAT_SEND')}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
