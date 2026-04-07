export interface FormattedAppointment {
  readonly id: string;
  readonly uuid: string;
  readonly appointmentNumber: string;
  readonly appointmentDate: string;
  readonly appointmentStartTime: string;
  readonly appointmentEndTime?: string;
  readonly service: string;
  readonly reason: string;
  readonly status: string;
  readonly provider: string;
}
