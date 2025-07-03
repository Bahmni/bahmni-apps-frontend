export interface Report {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  format: { text: string; value: string };
  action: string;
}
