import {
  Search as CarbonSearch,
  SearchProps as CarbonSearchProps,
} from '@carbon/react';
import React from 'react';

export type SearchProps = CarbonSearchProps & {
  testId?: string;
};

export const Search: React.FC<SearchProps> = ({ testId, ...carbonProps }) => {
  return <CarbonSearch {...carbonProps} data-testid={testId} />;
};
