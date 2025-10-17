import {
  Breadcrumb as CarbonBreadcrumb,
  BreadcrumbItem,
  BreadcrumbProps as CarbonBreadcrumbProps,
} from '@carbon/react';
import React from 'react';

export interface BreadcrumbItemType {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export type BreadcrumbProps = Omit<CarbonBreadcrumbProps, 'children'> & {
  items: BreadcrumbItemType[];
  testId?: string;
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  testId,
  noTrailingSlash = true,
  ...carbonProps
}) => {
  return (
    <CarbonBreadcrumb
      {...carbonProps}
      noTrailingSlash={noTrailingSlash}
      data-testid={testId}
    >
      {items.map((item) => (
        <BreadcrumbItem
          key={item.label}
          href={item.href}
          isCurrentPage={item.isCurrentPage}
        >
          {item.label}
        </BreadcrumbItem>
      ))}
    </CarbonBreadcrumb>
  );
};
