import {
  FileUploader as CarbonFileUploader,
  FileUploaderButton as CarbonFileUploaderButton,
  FileUploaderItem as CarbonFileUploaderItem,
  FileUploaderProps as CarbonFileUploaderProps,
} from '@carbon/react';
import React from 'react';

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
};

/** One selected file with its status and a remove button. */
export const FileUploaderItem: React.FC<FileUploaderItemProps> = ({
  testId,
  ...carbonProps
}) => {
  return <CarbonFileUploaderItem {...carbonProps} data-testid={testId} />;
};
