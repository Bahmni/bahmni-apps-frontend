import {
  InlineNotification as CarbonInlineNotification,
  InlineNotificationProps as CarbonInlineNotificationProps,
} from '@carbon/react';
import React from 'react';

export type InlineNotificationProps = CarbonInlineNotificationProps & {
  testId?: string;
};

export const InlineNotification: React.FC<InlineNotificationProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonInlineNotification {...carbonProps} data-testid={testId} />;
};
