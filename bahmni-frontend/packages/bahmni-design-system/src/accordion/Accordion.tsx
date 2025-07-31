import {
  Accordion as CarbonAccordion,
  AccordionProps as CarbonAccordionProps,
  AccordionItem,
  AccordionItemProps,
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

// AccordionItem wrapper
export type AccordionItemWrapperProps = AccordionItemProps & {
  testId?: string;
  children?: React.ReactNode;
};

export const AccordionItemWrapper: React.FC<AccordionItemWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <AccordionItem {...carbonProps} data-testid={testId}>
      {children}
    </AccordionItem>
  );
};
