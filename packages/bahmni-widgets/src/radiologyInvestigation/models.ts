export interface ImagingStudy {
  id: string;
  StudyInstanceUIDs: string;
  status: string;
}

export interface RadiologyInvestigationViewModel {
  readonly id: string;
  readonly testName: string;
  readonly priority: string;
  readonly orderedBy: string;
  readonly orderedDate: string;
  readonly status: string;
  readonly replaces?: string[];
  readonly basedOn?: string[];
  readonly imagingStudies?: ImagingStudy[];
  readonly note?: string;
  readonly reportId?: string;
  readonly reportedBy?: string;
  readonly reportedDate?: string;
  readonly linkedOrders?: RadiologyInvestigationViewModel[];
}
