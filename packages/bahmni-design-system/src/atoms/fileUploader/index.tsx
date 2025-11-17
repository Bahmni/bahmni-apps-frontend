import {
  FileUploader as CarbonFileUploader,
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
