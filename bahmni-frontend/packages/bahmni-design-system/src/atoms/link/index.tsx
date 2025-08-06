import {
  Link as CarbonLink,
  LinkProps as CarbonLinkProps,
} from '@carbon/react';
import React from 'react';

export type LinkProps = CarbonLinkProps<'a'> & {
  testId?: string;
};

export const Link: React.FC<LinkProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonLink {...carbonProps} data-testid={testId}>
      {children}
    </CarbonLink>
  );
};
