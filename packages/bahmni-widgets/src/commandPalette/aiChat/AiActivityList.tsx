import type { AiChatActivity } from '@bahmni/services';
import React from 'react';
import styles from './styles/AiChat.module.scss';

interface AiActivityListProps {
  activities: AiChatActivity[];
}

/** The event exactly as the backend sent it: no translation, no friendly wording. */
const rawText = (activity: AiChatActivity): string =>
  [
    `${activity.kind} ${activity.state}`,
    activity.server || activity.tool
      ? [activity.server, activity.tool].filter(Boolean).join('.')
      : undefined,
    activity.attempt === undefined ? undefined : `attempt ${activity.attempt}`,
  ]
    .filter(Boolean)
    .join(' · ');

/** One line per event while the assistant works; the owner removes them all when the reply is ready. */
export const AiActivityList: React.FC<AiActivityListProps> = ({
  activities,
}) => {
  if (activities.length === 0) return null;

  return (
    <ul className={styles.activityList} role="status" aria-live="polite">
      {activities.map((activity) => (
        <li
          key={activity.id}
          className={styles.activityLine}
          data-state={activity.state}
        >
          <span className={styles.activitySpinner} aria-hidden="true" />
          {rawText(activity)}
        </li>
      ))}
    </ul>
  );
};
