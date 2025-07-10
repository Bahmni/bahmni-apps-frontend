import { renderHook, waitFor, act } from '@testing-library/react';
import { useRegistrationConfig } from '../useRegistrationConfig';
import { RegistrationService } from '../../services/registration/registrationService';
import { useNotification } from '../useNotification';

// Mock dependencies
jest.mock('../../services/registration/registrationService');
jest.mock('../useNotification');

const mockRegistrationService = RegistrationService as jest.Mocked<typeof RegistrationService>;
const mockUseNotification = useNotification as jest.MockedFunction<typeof useNotification>;

describe('useRegistrationConfig', () => {
  const mockNotification = {
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    clearAllNotifications: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue(mockNotification);
  });

  describe('Initial Configuration Loading', () => {
    it('should load all configuration data on mount', async () => {
      // Mock all service responses
      mockRegistrationService.getPatientIdentifierTypes.mockResolvedValue([
        {
          uuid: 'id-type-1',
          name: 'OpenMRS ID',
          description: 'OpenMRS patient identifier',
          format: undefined,
          required: true,
          formatDescription: undefined,
          retired: false,
          links: [],
        },
      ]);

      mockRegistrationService.getPersonAttributeTypes.mockResolvedValue([
        {
          uuid: 'attr-type-1',
          name: 'Phone Number',
          description: 'Patient phone number',
          format: 'java.lang.String',
          required: false,
          searchable: true,
          retired: false,
          concept: undefined,
          links: [],
        },
      ]);

      mockRegistrationService.getLocations.mockResolvedValue([
        {
          uuid: 'location-1',
          display: 'Registration Desk',
        },
      ]);

      mockRegistrationService.getAddressHierarchy.mockResolvedValue([
        {
          uuid: 'address-1',
          name: 'Country',
          level: 1,
          parent: undefined,
          children: [],
        },
      ]);

      const { result } = renderHook(() => useRegistrationConfig());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.identifierTypes).toEqual([]);
      expect(result.current.personAttributeTypes).toEqual([]);
      expect(result.current.locations).toEqual([]);
      expect(result.current.addressHierarchy).toEqual([]);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.identifierTypes).toHaveLength(1);
      expect(result.current.personAttributeTypes).toHaveLength(1);
      expect(result.current.locations).toHaveLength(1);
      expect(result.current.addressHierarchy).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle configuration loading errors', async () => {
      const errorMessage = 'Failed to load configuration';
      mockRegistrationService.getPatientIdentifierTypes.mockRejectedValue(new Error(errorMessage));
      mockRegistrationService.getPersonAttributeTypes.mockResolvedValue([]);
      mockRegistrationService.getLocations.mockResolvedValue([]);
      mockRegistrationService.getAddressHierarchy.mockResolvedValue([]);

      const { result } = renderHook(() => useRegistrationConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to load registration configuration',
        message: errorMessage,
      });
    });

    it('should not auto-load when autoLoad is false', () => {
      const { result } = renderHook(() => useRegistrationConfig({ autoLoad: false }));

      expect(result.current.isLoading).toBe(false);
      expect(mockRegistrationService.getPatientIdentifierTypes).not.toHaveBeenCalled();
      expect(mockRegistrationService.getPersonAttributeTypes).not.toHaveBeenCalled();
      expect(mockRegistrationService.getLocations).not.toHaveBeenCalled();
      expect(mockRegistrationService.getAddressHierarchy).not.toHaveBeenCalled();
    });
  });

  describe('Manual Refresh Operations', () => {
    it('should refresh all configuration data', async () => {
      mockRegistrationService.getPatientIdentifierTypes.mockResolvedValue([]);
      mockRegistrationService.getPersonAttributeTypes.mockResolvedValue([]);
      mockRegistrationService.getLocations.mockResolvedValue([]);
      mockRegistrationService.getAddressHierarchy.mockResolvedValue([]);

      const { result } = renderHook(() => useRegistrationConfig({ autoLoad: false }));

      await act(async () => {
        await result.current.refreshConfig();
      });

      expect(mockRegistrationService.getPatientIdentifierTypes).toHaveBeenCalledTimes(1);
      expect(mockRegistrationService.getPersonAttributeTypes).toHaveBeenCalledTimes(1);
      expect(mockRegistrationService.getLocations).toHaveBeenCalledTimes(1);
      expect(mockRegistrationService.getAddressHierarchy).toHaveBeenCalledTimes(1);
    });

    it('should refresh identifier types only', async () => {
      const mockIdentifierTypes = [
        {
          uuid: 'id-type-2',
          name: 'Patient ID',
          description: 'Patient identifier',
          format: undefined,
          required: false,
          formatDescription: undefined,
          retired: false,
          links: [],
        },
      ];

      mockRegistrationService.getPatientIdentifierTypes.mockResolvedValue(mockIdentifierTypes);

      const { result } = renderHook(() => useRegistrationConfig({ autoLoad: false }));

      await act(async () => {
        await result.current.refreshIdentifierTypes();
      });

      expect(result.current.identifierTypes).toEqual(mockIdentifierTypes);
      expect(mockRegistrationService.getPatientIdentifierTypes).toHaveBeenCalledTimes(1);
      expect(mockRegistrationService.getPersonAttributeTypes).not.toHaveBeenCalled();
    });

    it('should refresh person attribute types only', async () => {
      const mockAttributeTypes = [
        {
          uuid: 'attr-type-2',
          name: 'Email Address',
          description: 'Patient email',
          format: 'java.lang.String',
          required: false,
          searchable: true,
          retired: false,
          concept: undefined,
          links: [],
        },
      ];

      mockRegistrationService.getPersonAttributeTypes.mockResolvedValue(mockAttributeTypes);

      const { result } = renderHook(() => useRegistrationConfig({ autoLoad: false }));

      await act(async () => {
        await result.current.refreshPersonAttributeTypes();
      });

      expect(result.current.personAttributeTypes).toEqual(mockAttributeTypes);
      expect(mockRegistrationService.getPersonAttributeTypes).toHaveBeenCalledTimes(1);
      expect(mockRegistrationService.getPatientIdentifierTypes).not.toHaveBeenCalled();
    });

    it('should refresh locations only', async () => {
      const mockLocations = [
        {
          uuid: 'location-2',
          display: 'Outpatient Clinic',
        },
      ];

      mockRegistrationService.getLocations.mockResolvedValue(mockLocations);

      const { result } = renderHook(() => useRegistrationConfig({ autoLoad: false }));

      await act(async () => {
        await result.current.refreshLocations();
      });

      expect(result.current.locations).toEqual(mockLocations);
      expect(mockRegistrationService.getLocations).toHaveBeenCalledTimes(1);
      expect(mockRegistrationService.getPatientIdentifierTypes).not.toHaveBeenCalled();
    });

    it('should refresh address hierarchy only', async () => {
      const mockAddressHierarchy = [
        {
          uuid: 'address-2',
          name: 'State',
          level: 2,
          parent: 'address-1',
          children: [],
        },
      ];

      mockRegistrationService.getAddressHierarchy.mockResolvedValue(mockAddressHierarchy);

      const { result } = renderHook(() => useRegistrationConfig({ autoLoad: false }));

      await act(async () => {
        await result.current.refreshAddressHierarchy();
      });

      expect(result.current.addressHierarchy).toEqual(mockAddressHierarchy);
      expect(mockRegistrationService.getAddressHierarchy).toHaveBeenCalledTimes(1);
      expect(mockRegistrationService.getPatientIdentifierTypes).not.toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    beforeEach(async () => {
      mockRegistrationService.getPatientIdentifierTypes.mockResolvedValue([
        {
          uuid: 'id-type-1',
          name: 'OpenMRS ID',
          description: 'OpenMRS patient identifier',
          format: undefined,
          required: true,
          formatDescription: undefined,
          retired: false,
          links: [],
        },
        {
          uuid: 'id-type-2',
          name: 'Patient ID',
          description: 'Patient identifier',
          format: undefined,
          required: false,
          formatDescription: undefined,
          retired: false,
          links: [],
        },
      ]);

      mockRegistrationService.getPersonAttributeTypes.mockResolvedValue([
        {
          uuid: 'attr-type-1',
          name: 'Phone Number',
          description: 'Patient phone number',
          format: 'java.lang.String',
          required: true,
          searchable: true,
          retired: false,
          concept: undefined,
          links: [],
        },
      ]);

      mockRegistrationService.getLocations.mockResolvedValue([
        {
          uuid: 'location-1',
          display: 'Registration Desk',
        },
      ]);

      mockRegistrationService.getAddressHierarchy.mockResolvedValue([]);
    });

    it('should get identifier type by UUID', async () => {
      const { result } = renderHook(() => useRegistrationConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const identifierType = result.current.getIdentifierTypeByUuid('id-type-1');
      expect(identifierType?.name).toBe('OpenMRS ID');

      const nonExistentType = result.current.getIdentifierTypeByUuid('non-existent');
      expect(nonExistentType).toBeUndefined();
    });

    it('should get person attribute type by UUID', async () => {
      const { result } = renderHook(() => useRegistrationConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const attributeType = result.current.getPersonAttributeTypeByUuid('attr-type-1');
      expect(attributeType?.name).toBe('Phone Number');

      const nonExistentType = result.current.getPersonAttributeTypeByUuid('non-existent');
      expect(nonExistentType).toBeUndefined();
    });

    it('should get location by UUID', async () => {
      const { result } = renderHook(() => useRegistrationConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const location = result.current.getLocationByUuid('location-1');
      expect(location?.display).toBe('Registration Desk');

      const nonExistentLocation = result.current.getLocationByUuid('non-existent');
      expect(nonExistentLocation).toBeUndefined();
    });

    it('should get required identifier types', async () => {
      const { result } = renderHook(() => useRegistrationConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const requiredTypes = result.current.getRequiredIdentifierTypes();
      expect(requiredTypes).toHaveLength(1);
      expect(requiredTypes[0].name).toBe('OpenMRS ID');
    });

    it('should get required person attribute types', async () => {
      const { result } = renderHook(() => useRegistrationConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const requiredTypes = result.current.getRequiredPersonAttributeTypes();
      expect(requiredTypes).toHaveLength(1);
      expect(requiredTypes[0].name).toBe('Phone Number');
    });
  });

  describe('Error Handling', () => {
    it('should handle partial configuration loading failures', async () => {
      mockRegistrationService.getPatientIdentifierTypes.mockResolvedValue([]);
      mockRegistrationService.getPersonAttributeTypes.mockRejectedValue(new Error('Attribute types error'));
      mockRegistrationService.getLocations.mockResolvedValue([]);
      mockRegistrationService.getAddressHierarchy.mockRejectedValue(new Error('Address hierarchy error'));

      const { result } = renderHook(() => useRegistrationConfig());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still have successfully loaded data
      expect(result.current.identifierTypes).toEqual([]);
      expect(result.current.locations).toEqual([]);

      // Should have empty arrays for failed loads
      expect(result.current.personAttributeTypes).toEqual([]);
      expect(result.current.addressHierarchy).toEqual([]);

      // Should show error notification
      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to load registration configuration',
        message: 'Attribute types error',
      });
    });

    it('should clear error state on successful refresh', async () => {
      // First call fails
      mockRegistrationService.getPatientIdentifierTypes.mockRejectedValueOnce(new Error('Network error'));
      mockRegistrationService.getPersonAttributeTypes.mockResolvedValue([]);
      mockRegistrationService.getLocations.mockResolvedValue([]);
      mockRegistrationService.getAddressHierarchy.mockResolvedValue([]);

      const { result } = renderHook(() => useRegistrationConfig());

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      // Second call succeeds
      mockRegistrationService.getPatientIdentifierTypes.mockResolvedValueOnce([]);

      await act(async () => {
        await result.current.refreshConfig();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should manage loading states correctly during refresh operations', async () => {
      mockRegistrationService.getPatientIdentifierTypes.mockResolvedValue([]);
      mockRegistrationService.getPersonAttributeTypes.mockResolvedValue([]);
      mockRegistrationService.getLocations.mockResolvedValue([]);
      mockRegistrationService.getAddressHierarchy.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const { result } = renderHook(() => useRegistrationConfig({ autoLoad: false }));

      // Start refresh
      act(() => {
        result.current.refreshConfig();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
