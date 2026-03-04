export interface FormRecordViewModel {
  id: string;
  formName: string;
  recordedOn: string;
  recordedBy: string;
  encounterDateTime: number;
  encounterUuid: string;
}

export interface GroupedFormRecords {
  formName: string;
  records: FormRecordViewModel[];
}
