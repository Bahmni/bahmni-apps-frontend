import {
  Tile as CarbonTile,
  TileProps as CarbonTileProps,
} from '@carbon/react';
import React from 'react';

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
