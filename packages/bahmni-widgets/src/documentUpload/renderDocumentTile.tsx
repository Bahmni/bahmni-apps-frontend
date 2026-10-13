import { FileTile, ImageTile, VideoTile } from '@bahmni/design-system';
import React from 'react';

export interface DocumentTileData {
  id: string;
  src: string;
  title: string;
  contentType?: string;
  ariaLabel?: string;
}

export const renderDocumentTile = ({
  id,
  src,
  title,
  contentType,
  ariaLabel,
}: DocumentTileData): React.ReactElement => {
  const type = (contentType ?? '').toLowerCase();
  if (type.includes('image')) {
    return (
      <ImageTile id={id} imageSrc={src} alt={title} ariaLabel={ariaLabel} />
    );
  }
  if (type.includes('video')) {
    return (
      <VideoTile
        id={id}
        videoSrc={src}
        modalTitle={title}
        ariaLabel={ariaLabel}
      />
    );
  }
  return (
    <FileTile id={id} src={src} modalTitle={title} ariaLabel={ariaLabel} />
  );
};
