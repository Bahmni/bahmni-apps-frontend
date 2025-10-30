/**
 * Central export point for all registration models
 */

// Patient data models
export type {
  BasicInfoData,
  AddressData,
  ContactData,
  AdditionalData,
} from './patient';

// Validation models
export type {
  BasicInfoErrors,
  ValidationErrors,
  AgeErrors,
  DateErrors,
  AddressErrors,
  ProfileValidationErrors,
  AgeValidationErrors,
  ValidationResult,
} from './validation';
