import {
  FileUploader as CarbonFileUploader,
  FileUploaderProps as CarbonFileUploaderProps,
  FileUploaderButton,
  FileUploaderDropContainer,
  FileUploaderItem,
  FileUploaderSkeleton,
} from '@carbon/react';
import React from 'react';

export type FileUploaderProps = CarbonFileUploaderProps & {
  testId?: string;
};

export const FileUploader: React.FC<FileUploaderProps> & {
  Button: typeof FileUploaderButton;
  DropContainer: typeof FileUploaderDropContainer;
  Item: typeof FileUploaderItem;
  Skeleton: typeof FileUploaderSkeleton;
} = ({ testId, children, ...carbonProps }) => {
  return (
    <CarbonFileUploader {...carbonProps} data-testid={testId}>
      {children}
    </CarbonFileUploader>
  );
};

// Attach subcomponents to FileUploader
FileUploader.Button = FileUploaderButton;
FileUploader.DropContainer = FileUploaderDropContainer;
FileUploader.Item = FileUploaderItem;
FileUploader.Skeleton = FileUploaderSkeleton;

export {
  FileUploaderButton,
  FileUploaderDropContainer,
  FileUploaderItem,
  FileUploaderSkeleton,
};
