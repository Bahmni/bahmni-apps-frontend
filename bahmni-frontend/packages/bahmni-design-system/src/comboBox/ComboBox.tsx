import {
  ComboBox as CarbonComboBox,
  ComboBoxProps as CarbonComboBoxProps,
  unstable__FluidComboBox as CarbonFluidComboBox,
  unstable__FluidComboBoxSkeleton as CarbonFluidComboBoxSkeleton,
} from '@carbon/react';
import type {
  FluidComboBoxProps as CarbonFluidComboBoxProps,
  FluidComboBoxSkeletonProps as CarbonFluidComboBoxSkeletonProps,
} from '@carbon/react/lib/components/FluidComboBox';
import React from 'react';

export type ComboBoxProps<ItemType> = CarbonComboBoxProps<ItemType> & {
  testId?: string;
};

export type FluidComboBoxProps<ItemType> =
  CarbonFluidComboBoxProps<ItemType> & {
    testId?: string;
  };

export type FluidComboBoxSkeletonProps = CarbonFluidComboBoxSkeletonProps & {
  testId?: string;
};

export const ComboBox = <ItemType,>({
  testId,
  ...carbonProps
}: ComboBoxProps<ItemType>) => {
  return <CarbonComboBox {...carbonProps} data-testid={testId} />;
};

export const FluidComboBox = <ItemType,>({
  testId,
  ...carbonProps
}: FluidComboBoxProps<ItemType>) => {
  return (
    <CarbonFluidComboBox
      {...(carbonProps as CarbonFluidComboBoxProps<unknown>)}
      data-testid={testId}
    />
  );
};

export const FluidComboBoxSkeleton: React.FC<FluidComboBoxSkeletonProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonFluidComboBoxSkeleton {...carbonProps} data-testid={testId} />;
};
