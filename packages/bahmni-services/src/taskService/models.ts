export interface CreateTaskPayload {
  resourceType: 'Task';
  intent: string;
  status: string;
  basedOn: Array<{ reference: string }>;
  note?: Array<{ text: string }>;
  owner?: { reference: string };
}
