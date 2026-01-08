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
  readonly replaces?: string[];
  readonly imagingStudies?: ImagingStudy[];
  readonly note?: string;
}
