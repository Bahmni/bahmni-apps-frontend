import { type AppointmentService, type Provider } from '@bahmni/services';

export interface SelectableItem {
  id: string;
  text: string;
  disabled?: boolean;
  isSelectAll?: boolean;
  originalItem?: AppointmentService | Provider;
}

export interface UnavailabilityFormData {
  locationUuid: string;
  selectedServiceItems: SelectableItem[];
  selectedProviderItems: SelectableItem[];
  startDate: Date | null;
  startTime: string;
  startTimePeriod: 'AM' | 'PM';
  endDate: Date | null;
  endTime: string;
  endTimePeriod: 'AM' | 'PM';
  filteredServicesCount: number;
  availableProvidersCount: number;
}

export interface UnavailabilityFormErrors {
  location?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dateTime?: string;
}

export interface BaseDataParams {
  locationUuid: string;
  startDate: Date;
  startTime: string;
  startTimePeriod: 'AM' | 'PM';
  endDate: Date;
  endTime: string;
  endTimePeriod: 'AM' | 'PM';
}

export interface BaseData {
  locationUuid: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}
