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
  thumbnail?: React.ReactNode;
};

export const FileUploaderItem: React.FC<FileUploaderItemProps> = ({
  testId,
  thumbnail,
  className,
  ...carbonProps
}) => {
  if (!thumbnail) {
    return (
      <CarbonFileUploaderItem
        {...carbonProps}
        className={className}
        data-testid={testId}
      />
    );
  }

  return (
    <div className={styles.itemWithThumbnail}>
      <div
        className={styles.thumbnail}
        data-testid={testId && `${testId}-thumbnail`}
      >
        {thumbnail}
      </div>
      <div className={styles.item}>
        <CarbonFileUploaderItem
          {...carbonProps}
          className={[styles.selectedFile, className].filter(Boolean).join(' ')}
          data-testid={testId}
        />
      </div>
    </div>
  );
};
