export interface FormRecordViewModel {
  id: string;
  formName: string;
  recordedOn: string;
  recordedBy: string;
  encounterDateTime: number;
  /** Per-form save timestamp; present when the backend exposes formSavedDateTime.
   *  Used for display and sort; falls back to encounterDateTime when absent. */
  formSavedDateTime?: number;
  encounterUuid: string;
}

export interface GroupedFormRecords {
  formName: string;
  records: FormRecordViewModel[];
}
