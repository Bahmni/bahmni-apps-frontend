import React from 'react';
import {
  Tile as CarbonTile,
  TileProps as CarbonTileProps,
  ClickableTile,
  ClickableTileProps,
  SelectableTile,
  SelectableTileProps,
  ExpandableTile,
  ExpandableTileProps,
  TileAboveTheFoldContent,
  TileAboveTheFoldContentProps,
  TileBelowTheFoldContent,
  TileBelowTheFoldContentProps,
} from '@carbon/react';

// Base Tile wrapper
export type TileProps = CarbonTileProps & {
  testId?: string;
};

export const Tile: React.FC<TileProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonTile {...carbonProps} data-testid={testId}>
      {children}
    </CarbonTile>
  );
};

// ClickableTile wrapper
export type ClickableTileWrapperProps = ClickableTileProps & {
  testId?: string;
};

export const ClickableTileWrapper: React.FC<ClickableTileWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <ClickableTile {...carbonProps} data-testid={testId}>
      {children}
    </ClickableTile>
  );
};

// SelectableTile wrapper
export type SelectableTileWrapperProps = SelectableTileProps & {
  testId?: string;
};

export const SelectableTileWrapper: React.FC<SelectableTileWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <SelectableTile {...carbonProps} data-testid={testId}>
      {children}
    </SelectableTile>
  );
};

// ExpandableTile wrapper
export type ExpandableTileWrapperProps = ExpandableTileProps & {
  testId?: string;
};

export const ExpandableTileWrapper: React.FC<ExpandableTileWrapperProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <ExpandableTile {...carbonProps} data-testid={testId}>
      {children}
    </ExpandableTile>
  );
};

// Re-export Carbon tile content components as-is (they don't need testId)
export { 
  TileAboveTheFoldContent, 
  TileBelowTheFoldContent,
  type TileAboveTheFoldContentProps,
  type TileBelowTheFoldContentProps
};