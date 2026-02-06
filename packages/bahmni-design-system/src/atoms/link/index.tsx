import {
  Link as CarbonLink,
  LinkProps as CarbonLinkProps,
} from '@carbon/react';
import React from 'react';

export type LinkProps = CarbonLinkProps<'a'> & {
  testId?: string;
  'data-testid'?: string;
};

export const Link: React.FC<LinkProps> = ({
  testId,
  'data-testid': dataTestId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonLink {...carbonProps} data-testid={testId ?? dataTestId}>
      {children}
    </CarbonLink>
  );
};
