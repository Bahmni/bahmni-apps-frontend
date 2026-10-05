import { uploadReportTemplate } from '@bahmni/services';
import { useMutation } from '@tanstack/react-query';

export const useUploadReportTemplate = () =>
  useMutation({
    mutationFn: (file: File) => uploadReportTemplate(file),
  });
