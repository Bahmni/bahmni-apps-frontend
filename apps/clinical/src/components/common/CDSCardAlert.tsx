import { InlineNotification } from '@bahmni/design-system';
import { type CDSCard } from '@bahmni/services';
import React from 'react';

interface CDSCardAlertProps {
  card: CDSCard;
}

const CDSCardAlert: React.FC<CDSCardAlertProps> = ({ card }) => {
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
      subtitle={card.source?.label}
      lowContrast
      hideCloseButton
    />
  );
};

export default CDSCardAlert;
