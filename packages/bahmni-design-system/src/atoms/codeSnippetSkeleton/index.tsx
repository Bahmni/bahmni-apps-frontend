import { CodeSnippetSkeleton as CarbonCodeSnippetSkeleton } from '@carbon/react';
import React from 'react';

export type CodeSnippetSkeletonProps = React.ComponentProps<
  typeof CarbonCodeSnippetSkeleton
> & {
  testId?: string;
};

export const CodeSnippetSkeleton: React.FC<CodeSnippetSkeletonProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonCodeSnippetSkeleton {...carbonProps} data-testid={testId} />;
};
