import {
  Accordion as CarbonAccordion,
  AccordionProps as CarbonAccordionProps,
  AccordionItem as CarbonAccordionItem,
  AccordionItemProps as CarbonAccordionItemProps,
} from '@carbon/react';
import React from 'react';

// Base Accordion wrapper
export type AccordionProps = CarbonAccordionProps & {
  testId?: string;
};

export const Accordion: React.FC<AccordionProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonAccordion {...carbonProps} data-testid={testId}>
      {children}
    </CarbonAccordion>
  );
};

export type AccordionItemProps = CarbonAccordionItemProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const AccordionItem: React.FC<AccordionItemProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonAccordionItem {...carbonProps} data-testid={testId}>
      {children}
    </CarbonAccordionItem>
  );
};
