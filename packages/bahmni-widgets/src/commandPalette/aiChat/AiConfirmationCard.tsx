import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AiChatPendingConfirmation } from './models';
import styles from './styles/AiChat.module.scss';

interface AiConfirmationCardProps {
  confirmation: AiChatPendingConfirmation;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}

/** "create_issue" -> "Create issue". */
const humanize = (tool: string): string => {
  const words = tool.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const formatValue = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

/** Asks the user to approve or reject the actions the assistant wants to run. */
export const AiConfirmationCard: React.FC<AiConfirmationCardProps> = ({
  confirmation,
  disabled,
  onApprove,
  onReject,
}) => {
  const { t } = useTranslation('command-palette');

  return (
    <div
      className={styles.confirmation}
      role="group"
      aria-label={t('COMMAND_PALETTE_AI_CHAT_CONFIRM_HEADING')}
    >
      <div className={styles.confirmationHeader}>
        <span className={styles.confirmationIcon} aria-hidden="true">
          !
        </span>
        <div>
          <p className={styles.confirmationHeading}>
            {t('COMMAND_PALETTE_AI_CHAT_CONFIRM_HEADING')}
          </p>
          <p className={styles.confirmationTitle}>
            {t('COMMAND_PALETTE_AI_CHAT_CONFIRM_TITLE')}
          </p>
        </div>
      </div>

      <ul className={styles.confirmationActions}>
        {confirmation.actions.map((action) => {
          const entries = Object.entries(action.arguments ?? {});
          return (
            <li key={action.id} className={styles.confirmationAction}>
              <div className={styles.confirmationActionName}>
                <span>{humanize(action.tool)}</span>
                <span className={styles.confirmationServer}>
                  {action.server}
                </span>
              </div>
              {entries.length > 0 && (
                <dl className={styles.confirmationArgs}>
                  {entries.map(([key, value]) => (
                    <React.Fragment key={key}>
                      <dt>{key}</dt>
                      <dd>{formatValue(value)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.confirmationButtons}>
        <button
          type="button"
          className={styles.confirmationReject}
          disabled={disabled}
          onClick={onReject}
        >
          {t('COMMAND_PALETTE_AI_CHAT_CONFIRM_REJECT')}
        </button>
        <button
          type="button"
          className={styles.confirmationApprove}
          disabled={disabled}
          onClick={onApprove}
        >
          {t('COMMAND_PALETTE_AI_CHAT_CONFIRM_APPROVE')}
        </button>
      </div>
    </div>
  );
};
