export interface CreateTaskPayload {
  resourceType: 'Task';
  intent: string;
  status: string;
  basedOn: Array<{ reference: string }>;
  for?: { reference: string };
  note?: Array<{ text: string }>;
  owner?: { reference: string };
  encounter?: { reference: string };
}

export interface CreateTaskOptions {
  notes?: string;
  ownerUuid?: string;
  encounterUuid?: string;
  patientUuid?: string;
}
