import { DEFAULT_FILE_TYPE } from './constants';
import { ProcessedFileData } from './models';

export async function processFileForUpload(
  file: File,
): Promise<ProcessedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = (reader.result as string).split(',')[1];
      const fullFileName = file.name;
      let fileName = fullFileName;
      let format = '';
      const lastDotIndex = fullFileName.lastIndexOf('.');

      if (lastDotIndex !== -1) {
        fileName = fullFileName.substring(0, lastDotIndex);
        format = fullFileName.substring(lastDotIndex + 1).toLowerCase();
      }

      const fileType = file.type ? file.type.split('/')[0] : DEFAULT_FILE_TYPE;

      resolve({
        content: base64Content,
        fileName,
        fileType,
        format,
      });
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
