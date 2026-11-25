export interface ActionReason {
  uuid: string;
  display: string;
  isNoteRequired?: boolean;
}

export interface ActionValues {
  reason: ActionReason | null;
  note: string;
}
