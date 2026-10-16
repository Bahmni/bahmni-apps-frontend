import {
  FileUploader as CarbonFileUploader,
  FileUploaderButton as CarbonFileUploaderButton,
  FileUploaderItem as CarbonFileUploaderItem,
  FileUploaderProps as CarbonFileUploaderProps,
} from '@carbon/react';
import React from 'react';
import styles from './styles/FileUploader.module.scss';

export type FileUploaderProps = CarbonFileUploaderProps & {
  testId?: string;
};

export const FileUploader: React.FC<FileUploaderProps> = ({
  testId,
  children,
  ...carbonProps
}) => {
  return (
    <CarbonFileUploader {...carbonProps} data-testid={testId}>
      {children}
    </CarbonFileUploader>
  );
};

export type FileUploaderButtonProps = React.ComponentProps<
  typeof CarbonFileUploaderButton
> & {
  testId?: string;
};

/** The button that opens the file dialog, for building an uploader whose file list the caller owns. */
export const FileUploaderButton: React.FC<FileUploaderButtonProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonFileUploaderButton {...carbonProps} data-testid={testId} />;
};

export type FileUploaderItemProps = React.ComponentProps<
  typeof CarbonFileUploaderItem
> & {
  testId?: string;
  /**
   * Optional preview shown in a square beside the file, e.g. an image or an icon. An image fills the
   * square. Without it the item looks exactly as Carbon draws it.
   */
  thumbnail?: React.ReactNode;
};

/** One selected file with its status and a remove button, optionally with a thumbnail. */
export const FileUploaderItem: React.FC<FileUploaderItemProps> = ({
  testId,
  thumbnail,
  ...carbonProps
}) => {
  const item = <CarbonFileUploaderItem {...carbonProps} data-testid={testId} />;

  if (!thumbnail) {
    return item;
  }

  return (
    <div className={styles.itemWithThumbnail}>
      <div
        className={styles.thumbnail}
        data-testid={testId && `${testId}-thumbnail`}
      >
        {thumbnail}
      </div>
      <div className={styles.item}>{item}</div>
    </div>
  );
};
