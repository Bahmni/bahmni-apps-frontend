import {
  Tag as CarbonTag,
  TagProps as CarbonTagProps,
  DismissibleTag,
  DismissibleTagProps,
  OperationalTag,
  OperationalTagProps,
  SelectableTag,
  SelectableTagProps,
  TagSkeleton,
  TagSkeletonProps,
} from '@carbon/react';
import React from 'react';

// Base Tag wrapper
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

// DismissibleTag wrapper
export type DismissibleTagWrapperProps = DismissibleTagProps<'div'> & {
  testId?: string;
};

export const DismissibleTagWrapper: React.FC<DismissibleTagWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <DismissibleTag {...carbonProps} data-testid={testId}>
      {children}
    </DismissibleTag>
  );
};

// OperationalTag wrapper
export type OperationalTagWrapperProps = OperationalTagProps<'div'> & {
  testId?: string;
};

export const OperationalTagWrapper: React.FC<OperationalTagWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <OperationalTag {...carbonProps} data-testid={testId}>
      {children}
    </OperationalTag>
  );
};

// SelectableTag wrapper
export type SelectableTagWrapperProps = SelectableTagProps<'div'> & {
  testId?: string;
};

export const SelectableTagWrapper: React.FC<SelectableTagWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <SelectableTag {...carbonProps} data-testid={testId}>
      {children}
    </SelectableTag>
  );
};

// TagSkeleton wrapper
export type TagSkeletonWrapperProps = TagSkeletonProps & {
  testId?: string;
};

export const TagSkeletonWrapper: React.FC<TagSkeletonWrapperProps> = ({
  testId,
  ...carbonProps
}) => {
  return <TagSkeleton {...carbonProps} data-testid={testId} />;
};
