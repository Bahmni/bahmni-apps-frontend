import { create } from 'zustand';
import type {
  AdditionalData,
  AddressData,
  BasicInfoData,
  ContactData,
} from '../models/patient';
import type {
  AddressErrors,
  AgeValidationErrors,
  ProfileValidationErrors,
  ValidationResult,
} from '../models/validation';

// Combined state interface
interface PatientRegistrationState {
  // Patient Profile Data
  profile: BasicInfoData;
  dobEstimated: boolean;

  // Validation Errors
  profileErrors: ProfileValidationErrors;
  ageErrors: AgeValidationErrors;

  // Address Data
  address: AddressData;
  addressErrors: AddressErrors;
  addressSelectedFromDropdown: {
    district: boolean;
    state: boolean;
    pincode: boolean;
  };

  // Contact Data
  contact: ContactData;

  // Additional Information
  additionalInfo: AdditionalData;

  // Actions for Profile
  setProfile: (profile: Partial<BasicInfoData>) => void;
  setProfileField: (
    field: keyof BasicInfoData,
    value: string | boolean,
  ) => void;
  setDobEstimated: (value: boolean) => void;
  setProfileErrors: (errors: Partial<ProfileValidationErrors>) => void;
  setAgeErrors: (errors: Partial<AgeValidationErrors>) => void;

  // Actions for Address
  setAddress: (address: Partial<AddressData>) => void;
  setAddressField: (field: keyof AddressData, value: string) => void;
  setAddressErrors: (errors: Partial<AddressErrors>) => void;
  setAddressSelectedFromDropdown: (
    field: 'district' | 'state' | 'pincode',
    value: boolean,
  ) => void;

  // Actions for Contact
  setContact: (contact: Partial<ContactData>) => void;
  setContactField: (field: keyof ContactData, value: string) => void;

  // Actions for Additional Info
  setAdditionalInfo: (info: Partial<AdditionalData>) => void;
  setAdditionalInfoField: (field: keyof AdditionalData, value: string) => void;

  // Validation Actions
  validateProfile: () => boolean;
  validateAddress: () => boolean;
  validateAll: () => ValidationResult;
  clearValidationErrors: () => void;

  // Global Actions
  resetForm: () => void;
  resetSection: (
    section: 'profile' | 'address' | 'contact' | 'additionalInfo',
  ) => void;
}

// Initial state values
const initialProfileState: BasicInfoData = {
  patientIdFormat: '',
  entryType: false,
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  ageYears: '',
  ageMonths: '',
  ageDays: '',
  dateOfBirth: '',
  birthTime: '',
};

const initialAddressState: AddressData = {
  houseNumber: '',
  locality: '',
  district: '',
  city: '',
  state: '',
  pincode: '',
};

const initialProfileErrors: ProfileValidationErrors = {
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
};

const initialAgeErrors: AgeValidationErrors = {
  ageYears: '',
  ageMonths: '',
  ageDays: '',
};

const initialAddressErrors: AddressErrors = {
  district: '',
  state: '',
  pincode: '',
};

const initialAddressSelectedFromDropdown = {
  district: false,
  state: false,
  pincode: false,
};

const initialContactState: ContactData = {
  phoneNumber: '',
  altPhoneNumber: '',
};

const initialAdditionalInfoState: AdditionalData = {
  email: '',
};

// Create the store
export const usePatientRegistrationStore = create<PatientRegistrationState>(
  (set, get) => ({
    // Initial State
    profile: initialProfileState,
    dobEstimated: false,
    profileErrors: initialProfileErrors,
    ageErrors: initialAgeErrors,
    address: initialAddressState,
    addressErrors: initialAddressErrors,
    addressSelectedFromDropdown: initialAddressSelectedFromDropdown,
    contact: initialContactState,
    additionalInfo: initialAdditionalInfoState,

    // Profile Actions
    setProfile: (profile) =>
      set((state) => ({
        profile: { ...state.profile, ...profile },
      })),

    setProfileField: (field, value) =>
      set((state) => ({
        profile: { ...state.profile, [field]: value },
      })),

    setDobEstimated: (value) => set({ dobEstimated: value }),

    setProfileErrors: (errors) =>
      set((state) => ({
        profileErrors: { ...state.profileErrors, ...errors },
      })),

    setAgeErrors: (errors) =>
      set((state) => ({
        ageErrors: { ...state.ageErrors, ...errors },
      })),

    // Address Actions
    setAddress: (address) =>
      set((state) => ({
        address: { ...state.address, ...address },
      })),

    setAddressField: (field, value) =>
      set((state) => ({
        address: { ...state.address, [field]: value },
      })),

    setAddressErrors: (errors) =>
      set((state) => ({
        addressErrors: { ...state.addressErrors, ...errors },
      })),

    setAddressSelectedFromDropdown: (field, value) =>
      set((state) => ({
        addressSelectedFromDropdown: {
          ...state.addressSelectedFromDropdown,
          [field]: value,
        },
      })),

    // Contact Actions
    setContact: (contact) =>
      set((state) => ({
        contact: { ...state.contact, ...contact },
      })),

    setContactField: (field, value) =>
      set((state) => ({
        contact: { ...state.contact, [field]: value },
      })),

    // Additional Info Actions
    setAdditionalInfo: (info) =>
      set((state) => ({
        additionalInfo: { ...state.additionalInfo, ...info },
      })),

    setAdditionalInfoField: (field, value) =>
      set((state) => ({
        additionalInfo: { ...state.additionalInfo, [field]: value },
      })),

    // Validation Actions
    validateProfile: () => {
      const state = get();
      let isValid = true;
      const errors: ProfileValidationErrors = {
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
      };

      // Validate required fields
      if (!state.profile.firstName.trim()) {
        errors.firstName = 'First name is required';
        isValid = false;
      }

      if (!state.profile.lastName.trim()) {
        errors.lastName = 'Last name is required';
        isValid = false;
      }

      if (!state.profile.gender) {
        errors.gender = 'Gender is required';
        isValid = false;
      }

      if (!state.profile.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
        isValid = false;
      }

      // Update profile errors in state
      set({ profileErrors: errors });

      return isValid;
    },

    validateAddress: () => {
      const state = get();
      let isValid = true;
      const errors: AddressErrors = {
        district: '',
        state: '',
        pincode: '',
      };

      // Validate address fields - if they have a value, it must be from dropdown
      if (
        state.address.district &&
        !state.addressSelectedFromDropdown.district
      ) {
        errors.district = 'Please select from dropdown';
        isValid = false;
      }

      if (state.address.state && !state.addressSelectedFromDropdown.state) {
        errors.state = 'Please select from dropdown';
        isValid = false;
      }

      if (state.address.pincode && !state.addressSelectedFromDropdown.pincode) {
        errors.pincode = 'Please select from dropdown';
        isValid = false;
      }

      // Update address errors in state
      set({ addressErrors: errors });

      return isValid;
    },

    validateAll: (): ValidationResult => {
      const profileValid = get().validateProfile();
      const addressValid = get().validateAddress();
      const state = get();

      return {
        isValid: profileValid && addressValid,
        errors: {
          profile: state.profileErrors,
          age: state.ageErrors,
          address: state.addressErrors,
        },
      };
    },

    clearValidationErrors: () =>
      set({
        profileErrors: initialProfileErrors,
        ageErrors: initialAgeErrors,
        addressErrors: initialAddressErrors,
      }),

    // Global Actions
    resetForm: () =>
      set({
        profile: initialProfileState,
        dobEstimated: false,
        profileErrors: initialProfileErrors,
        ageErrors: initialAgeErrors,
        address: initialAddressState,
        addressErrors: initialAddressErrors,
        addressSelectedFromDropdown: initialAddressSelectedFromDropdown,
        contact: initialContactState,
        additionalInfo: initialAdditionalInfoState,
      }),

    resetSection: (section) =>
      set((state) => {
        switch (section) {
          case 'profile':
            return {
              profile: initialProfileState,
              dobEstimated: false,
              profileErrors: initialProfileErrors,
              ageErrors: initialAgeErrors,
            };
          case 'address':
            return {
              address: initialAddressState,
              addressErrors: initialAddressErrors,
              addressSelectedFromDropdown: initialAddressSelectedFromDropdown,
            };
          case 'contact':
            return {
              contact: initialContactState,
            };
          case 'additionalInfo':
            return {
              additionalInfo: initialAdditionalInfoState,
            };
          default:
            return state;
        }
      }),
  }),
);

// Selector hooks for better performance
export const useProfileData = () =>
  usePatientRegistrationStore((state) => state.profile);
export const useAddressData = () =>
  usePatientRegistrationStore((state) => state.address);
export const useContactData = () =>
  usePatientRegistrationStore((state) => state.contact);
export const useAdditionalInfoData = () =>
  usePatientRegistrationStore((state) => state.additionalInfo);

// Error selector hooks
export const useProfileErrors = () =>
  usePatientRegistrationStore((state) => state.profileErrors);
export const useAgeErrors = () =>
  usePatientRegistrationStore((state) => state.ageErrors);
export const useAddressErrors = () =>
  usePatientRegistrationStore((state) => state.addressErrors);

// Action hooks
export const useProfileActions = () =>
  usePatientRegistrationStore((state) => ({
    setProfile: state.setProfile,
    setProfileField: state.setProfileField,
    setDobEstimated: state.setDobEstimated,
    setProfileErrors: state.setProfileErrors,
    setAgeErrors: state.setAgeErrors,
  }));

export const useAddressActions = () =>
  usePatientRegistrationStore((state) => ({
    setAddress: state.setAddress,
    setAddressField: state.setAddressField,
    setAddressErrors: state.setAddressErrors,
    setAddressSelectedFromDropdown: state.setAddressSelectedFromDropdown,
  }));

export const useContactActions = () =>
  usePatientRegistrationStore((state) => ({
    setContact: state.setContact,
    setContactField: state.setContactField,
  }));

export const useAdditionalInfoActions = () =>
  usePatientRegistrationStore((state) => ({
    setAdditionalInfo: state.setAdditionalInfo,
    setAdditionalInfoField: state.setAdditionalInfoField,
  }));

// Validation hooks
export const useValidationActions = () =>
  usePatientRegistrationStore((state) => ({
    validateProfile: state.validateProfile,
    validateAddress: state.validateAddress,
    validateAll: state.validateAll,
    clearValidationErrors: state.clearValidationErrors,
  }));

export const useFormActions = () =>
  usePatientRegistrationStore((state) => ({
    resetForm: state.resetForm,
    resetSection: state.resetSection,
  }));
