import { Tag as CarbonTag, TagProps as CarbonTagProps } from '@carbon/react';
import React from 'react';

export type TagProps = CarbonTagProps<'div'> & {
  testId?: string;
};

export const Tag: React.FC<TagProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonTag {...carbonProps} data-testid={testId}>
      {children}
    </CarbonTag>
  );
};
