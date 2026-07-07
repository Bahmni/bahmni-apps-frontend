import { FileTile, ImageTile, VideoTile } from '@bahmni/design-system';
import React from 'react';

export interface DocumentTileData {
  id: string;
  src: string;
  title: string;
  contentType?: string;
}

export const renderDocumentTile = ({
  id,
  src,
  title,
  contentType,
}: DocumentTileData): React.ReactElement => {
  const type = (contentType ?? '').toLowerCase();
  if (type.includes('image')) {
    return <ImageTile id={id} imageSrc={src} alt={title} />;
  }
  if (type.includes('video')) {
    return <VideoTile id={id} videoSrc={src} modalTitle={title} />;
  }
  return <FileTile id={id} src={src} modalTitle={title} />;
};
