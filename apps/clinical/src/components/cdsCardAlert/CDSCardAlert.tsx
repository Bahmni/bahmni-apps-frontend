import { InlineNotification } from '@bahmni/design-system';
import { type CDSCard } from '@bahmni/services';
import React from 'react';

interface CDSCardAlertProps {
  card: CDSCard;
  className?: string;
}

const CDSCardAlert: React.FC<CDSCardAlertProps> = ({ card, className }) => {
  const getNotificationKind = (
    indicator: 'info' | 'warning' | 'critical',
  ): 'info' | 'warning' | 'error' => {
    switch (indicator) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <InlineNotification
      kind={getNotificationKind(card.indicator)}
      title={card.summary}
      lowContrast
      hideCloseButton
      className={className}
    />
  );
};

export default CDSCardAlert;
