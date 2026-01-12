export interface ObservationData {
  concept: {
    name: string;
    uuid: string;
    shortName?: string;
    units?: string;
    hiNormal?: number;
    lowNormal?: number;
  };
  value?: unknown;
  valueAsString?: string;
  conceptNameToDisplay?: string;
  groupMembers?: ObservationData[];
  formFieldPath?: string;
  comment?: string;
  providers?: Array<{
    uuid: string;
    name: string;
  }>;
  interpretation?: string;
}

interface FormRecordViewModel {
  id: string;
  formName: string;
  recordedOn: string;
  recordedBy: string;
  encounterDateTime: number;
  encounterUuid: string;
}

interface GroupedFormRecords {
  formName: string;
  records: FormRecordViewModel[];
}
export type { FormRecordViewModel, GroupedFormRecords };
