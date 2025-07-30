import {
  NumberInput as CarbonNumberInput,
  NumberInputProps as CarbonNumberInputProps,
  NumberInputSkeleton as CarbonNumberInputSkeleton,
  NumberInputSkeletonProps as CarbonNumberInputSkeletonProps,
  unstable__FluidNumberInput as CarbonFluidNumberInput,
  unstable__FluidNumberInputSkeleton as CarbonFluidNumberInputSkeleton,
} from '@carbon/react';
import type {
  FluidNumberInputProps as CarbonFluidNumberInputProps,
  FluidNumberInputSkeletonProps as CarbonFluidNumberInputSkeletonProps,
} from '@carbon/react/lib/components/FluidNumberInput';
import React from 'react';

export type NumberInputProps = CarbonNumberInputProps & {
  testId?: string;
};

export type NumberInputSkeletonProps = CarbonNumberInputSkeletonProps & {
  testId?: string;
};

export type FluidNumberInputProps = CarbonFluidNumberInputProps & {
  testId?: string;
};

export type FluidNumberInputSkeletonProps =
  CarbonFluidNumberInputSkeletonProps & {
    testId?: string;
  };

export const NumberInput: React.FC<NumberInputProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonNumberInput {...carbonProps} data-testid={testId} />;
};

export const NumberInputSkeleton: React.FC<NumberInputSkeletonProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonNumberInputSkeleton {...carbonProps} data-testid={testId} />;
};

export const FluidNumberInput: React.FC<FluidNumberInputProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonFluidNumberInput {...carbonProps} data-testid={testId} />;
};

export const FluidNumberInputSkeleton: React.FC<
  FluidNumberInputSkeletonProps
> = ({ testId, ...carbonProps }) => {
  return (
    <CarbonFluidNumberInputSkeleton {...carbonProps} data-testid={testId} />
  );
};
