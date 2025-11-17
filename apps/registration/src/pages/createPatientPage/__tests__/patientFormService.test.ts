import { notificationService } from '@bahmni/services';
import { validateAllSections, collectFormData } from '../patientFormService';
import type { PatientFormRefs } from '../patientFormService';

// Mock the notification service
jest.mock('@bahmni/services', () => ({
  notificationService: {
    showError: jest.fn(),
  },
}));

describe('patientFormService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAllSections', () => {
    it('should return true when all sections are valid', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
      };

      const result = validateAllSections(mockRefs);

      expect(result).toBe(true);
      expect(mockRefs.profileRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.addressRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.contactRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.additionalRef.current?.validate).toHaveBeenCalled();
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should return false when profile validation fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
      };

      const result = validateAllSections(mockRefs);

      expect(result).toBe(false);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Please fix validation errors',
        5000,
      );
    });

    it('should return false when address validation fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
      };

      const result = validateAllSections(mockRefs);

      expect(result).toBe(false);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Please fix validation errors',
        5000,
      );
    });

    it('should return false when contact validation fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
      };

      const result = validateAllSections(mockRefs);

      expect(result).toBe(false);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Please fix validation errors',
        5000,
      );
    });

    it('should return false when additional validation fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
      };

      const result = validateAllSections(mockRefs);

      expect(result).toBe(false);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Please fix validation errors',
        5000,
      );
    });

    it('should return false when multiple sections fail validation', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
      };

      const result = validateAllSections(mockRefs);

      expect(result).toBe(false);
      expect(notificationService.showError).toHaveBeenCalledTimes(1);
    });

    it('should return false when ref current is null', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: null,
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
      };

      const result = validateAllSections(mockRefs);

      expect(result).toBe(false);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Please fix validation errors',
        5000,
      );
    });

    it('should validate all sections even if first one fails', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(() => false),
            getData: jest.fn(),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(() => true),
            getData: jest.fn(),
          },
        },
      };

      validateAllSections(mockRefs);

      // Verify all validate methods were called even though first one failed
      expect(mockRefs.profileRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.addressRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.contactRef.current?.validate).toHaveBeenCalled();
      expect(mockRefs.additionalRef.current?.validate).toHaveBeenCalled();
    });
  });

  describe('collectFormData', () => {
    it('should collect data from all sections successfully', () => {
      const mockProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        dobEstimated: false,
        patientIdentifier: {
          identifierPrefix: 'BDH',
          identifierType: 'Primary',
          preferred: true,
          voided: false,
        },
      };

      const mockAddressData = {
        address1: '123 Main St',
        cityVillage: 'New York',
      };

      const mockContactData = {
        phoneNumber: '1234567890',
      };

      const mockAdditionalData = {
        email: 'john@example.com',
      };

      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockProfileData),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockAddressData),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockContactData),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => mockAdditionalData),
          },
        },
      };

      const result = collectFormData(mockRefs);

      expect(result).toEqual({
        profile: mockProfileData,
        address: mockAddressData,
        contact: mockContactData,
        additional: mockAdditionalData,
      });
      expect(notificationService.showError).not.toHaveBeenCalled();
    });

    it('should return null when profile data is missing', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => null),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })),
          },
        },
      };

      const result = collectFormData(mockRefs);

      expect(result).toBeNull();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Unable to get patient data',
        5000,
      );
    });

    it('should return null when address data is missing', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({
              firstName: 'John',
              lastName: 'Doe',
              gender: 'male',
            })),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => null),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })),
          },
        },
      };

      const result = collectFormData(mockRefs);

      expect(result).toBeNull();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Unable to get patient address data',
        5000,
      );
    });

    it('should return null when contact data is missing', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({
              firstName: 'John',
              lastName: 'Doe',
              gender: 'male',
            })),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => null),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })),
          },
        },
      };

      const result = collectFormData(mockRefs);

      expect(result).toBeNull();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Unable to get patient contact data',
        5000,
      );
    });

    it('should return null when additional data is missing', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({
              firstName: 'John',
              lastName: 'Doe',
              gender: 'male',
            })),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => null),
          },
        },
      };

      const result = collectFormData(mockRefs);

      expect(result).toBeNull();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Unable to get patient additional data',
        5000,
      );
    });

    it('should return null when ref current is null', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: null,
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })),
          },
        },
      };

      const result = collectFormData(mockRefs);

      expect(result).toBeNull();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Unable to get patient data',
        5000,
      );
    });

    it('should call getData on all refs before the failing one', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({
              firstName: 'John',
              lastName: 'Doe',
              gender: 'male',
            })),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => null),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })),
          },
        },
      };

      collectFormData(mockRefs);

      expect(mockRefs.profileRef.current?.getData).toHaveBeenCalled();
      expect(mockRefs.addressRef.current?.getData).toHaveBeenCalled();
      expect(mockRefs.contactRef.current?.getData).toHaveBeenCalled();
      // Should not call additionalRef.getData because contactRef returned null
      expect(mockRefs.additionalRef.current?.getData).not.toHaveBeenCalled();
    });

    it('should handle undefined getData return values', () => {
      const mockRefs: PatientFormRefs = {
        profileRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => undefined),
            clearData: jest.fn(),
            setCustomError: jest.fn(),
          },
        },
        addressRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ address1: '123 Main St' })),
          },
        },
        contactRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ phoneNumber: '1234567890' })),
          },
        },
        additionalRef: {
          current: {
            validate: jest.fn(),
            getData: jest.fn(() => ({ email: 'test@example.com' })),
          },
        },
      };

      const result = collectFormData(mockRefs);

      expect(result).toBeNull();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Unable to get patient data',
        5000,
      );
    });
  });
});
