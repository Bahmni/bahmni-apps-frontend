import {
  Section as CarbonSection,
  SectionProps as CarbonSectionProps,
} from '@carbon/react';
import React from 'react';

export type SectionProps = CarbonSectionProps<'div'> & {
  testId?: string;
};

export const Section: React.FC<SectionProps> = ({ testId, ...carbonProps }) => {
  return <CarbonSection {...carbonProps} data-testid={testId} />;
};
