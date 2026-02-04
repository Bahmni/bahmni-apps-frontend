import {
  Tile as CarbonTile,
  TileProps as CarbonTileProps,
} from '@carbon/react';
import React from 'react';

export type TileProps = CarbonTileProps & {
  testId?: string;
  'data-testid'?: string;
};

export const Tile: React.FC<TileProps> = ({
  testId,
  'data-testid': dataTestId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonTile {...carbonProps} data-testid={testId ?? dataTestId}>
      {children}
    </CarbonTile>
  );
};
