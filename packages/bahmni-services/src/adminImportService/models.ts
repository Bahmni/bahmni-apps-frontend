export interface ImportedItem {
  id: string;
  originalFileName: string;
  savedFileName: string | null;
  errorFileName: string | null;
  type: string | null;
  status: string;
  successfulRecords: number;
  failedRecords: number;
  stageName: string | null;
  uploadedBy: string | null;
  startTime: number;
  endTime: number | null;
  stackTrace: string | null;
  errorMessage: string | null;
}

export interface ImportType {
  key: string;
  labelKey: string;
  url: string;
}

export interface UploadProgress {
  loaded: number;
  total?: number;
}
