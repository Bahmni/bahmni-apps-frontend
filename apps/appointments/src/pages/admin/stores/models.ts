import { DAYS_OF_WEEK } from '../constants';

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export type UpdateField =
  | 'startTime'
  | 'startMeridiem'
  | 'endTime'
  | 'endMeridiem'
  | 'maxLoad';

export interface AvailabilityRow {
  id: string;
  startTime: string;
  startMeridiem: 'AM' | 'PM';
  endTime: string;
  endMeridiem: 'AM' | 'PM';
  isEndTimeUserSet: boolean;
  maxLoad: number | null;
  daysOfWeek: DayOfWeek[];
  errors: {
    startTime?: string;
    endTime?: string;
    daysOfWeek?: string;
    overlap?: string;
  };
}
