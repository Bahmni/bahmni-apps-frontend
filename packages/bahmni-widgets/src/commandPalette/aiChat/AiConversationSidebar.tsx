import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AiConversation } from './models';
import styles from './styles/AiChat.module.scss';

interface AiConversationSidebarProps {
  conversations: AiConversation[];
  activeConversationId: string | null;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
});

const RELATIVE_TIME_DIVISIONS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, 'seconds'],
  [60, 'minutes'],
  [24, 'hours'],
  [7, 'days'],
  [4.34524, 'weeks'],
  [12, 'months'],
  [Number.POSITIVE_INFINITY, 'years'],
];

const formatRelativeDate = (isoDate: string): string => {
  let duration = (new Date(isoDate).getTime() - Date.now()) / 1000;
  for (const [amount, unit] of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return relativeTimeFormatter.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return '';
};

export const AiConversationSidebar: React.FC<AiConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
}) => {
  const { t } = useTranslation('command-palette');
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <nav
      className={styles.sidebar}
      aria-label={t('COMMAND_PALETTE_AI_CHAT_HISTORY_TITLE')}
    >
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>
          {t('COMMAND_PALETTE_AI_CHAT_HISTORY_TITLE')}
        </span>
      </div>

      {sortedConversations.length === 0 && (
        <p className={styles.sidebarEmpty}>
          {t('COMMAND_PALETTE_AI_CHAT_HISTORY_EMPTY')}
        </p>
      )}

      <div className={styles.sidebarList}>
        {sortedConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={
              conversation.id === activeConversationId
                ? `${styles.sidebarItem} ${styles.sidebarItemActive}`
                : styles.sidebarItem
            }
          >
            <button
              type="button"
              className={styles.sidebarItemContent}
              onClick={() => onSelect(conversation.id)}
              aria-current={conversation.id === activeConversationId}
            >
              <span className={styles.sidebarItemTitle}>
                {conversation.title || t('COMMAND_PALETTE_AI_CHAT_ITEM_LABEL')}
              </span>
              <span className={styles.sidebarItemDate}>
                {formatRelativeDate(conversation.updatedAt)}
              </span>
            </button>
            <button
              type="button"
              className={styles.sidebarItemDelete}
              aria-label={t('COMMAND_PALETTE_AI_CHAT_DELETE_CONVERSATION')}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(conversation.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </nav>
  );
};
