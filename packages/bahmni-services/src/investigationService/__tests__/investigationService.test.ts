import { ValueSet } from 'fhir/r4';
import i18next from 'i18next';
import * as api from '../../api';
import * as conceptService from '../../conceptService';
import {
  ALL_ORDERABLES_CONCEPT_NAME,
  ORDER_TYPE_URL,
  PANEL_CONCEPT_CLASS_NAME,
  FHIR_CONCEPT_CLASS_EXTENSION_URL,
} from '../constants';
import {
  getFlattenedInvestigations,
  getCategoryUuidFromOrderTypes,
} from '../investigationService';
import { OrderTypeResponse } from '../model';

jest.mock('../../conceptService');
jest.mock('../../api');
jest.mock('i18next');

describe('investigationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock i18next.t to return the translation key by default
    (i18next.t as unknown as jest.Mock).mockImplementation(
      (key: string) => key,
    );
  });

  describe('getFlattenedInvestigations', () => {
    const mockOrderTypeResponse: OrderTypeResponse = {
      results: [
        {
          uuid: 'lab-order-type-uuid',
          display: 'Lab Order',
          conceptClasses: [
            { uuid: 'test-class-uuid', name: 'Test' },
            { uuid: 'labtest-class-uuid', name: 'LabTest' },
          ],
        },
        {
          uuid: 'radiology-order-type-uuid',
          display: 'Radiology Order',
          conceptClasses: [
            {
              uuid: 'radiology-class-uuid',
              name: 'Radiology/Imaging Procedure',
            },
          ],
        },
      ],
    };

    const mockValueSet: ValueSet = {
      resourceType: 'ValueSet',
      id: 'test-valueset',
      status: 'active',
      expansion: {
        timestamp: '2024-01-01T00:00:00Z',
        contains: [
          {
            code: 'LAB',
            display: 'Laboratory',
            contains: [
              {
                code: 'BIOCHEM',
                display: 'Biochemistry',
                contains: [
                  {
                    code: 'GLU',
                    display: 'Glucose',
                    extension: [
                      {
                        url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                        valueString: 'LabTest',
                      },
                    ],
                  },
                  {
                    code: 'CREAT',
                    display: 'Creatinine',
                    extension: [
                      {
                        url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                        valueString: 'LabTest',
                      },
                    ],
                  },
                ],
              },
              {
                code: 'HEMA',
                display: 'Hematology',
                contains: [
                  {
                    code: 'CBC',
                    display: 'Complete Blood Count',
                    extension: [
                      {
                        url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                        valueString: 'Test',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            code: 'RAD',
            display: 'Radiology',
            contains: [
              {
                code: 'XRAY',
                display: 'X-Ray',
                contains: [
                  {
                    code: 'CXR',
                    display: 'Chest X-Ray',
                    extension: [
                      {
                        url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                        valueString: 'Radiology/Imaging Procedure',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    it('should fetch and flatten investigations successfully', async () => {
      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        mockValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      expect(conceptService.searchFHIRConceptsByName).toHaveBeenCalledWith(
        ALL_ORDERABLES_CONCEPT_NAME,
      );
      expect(api.get).toHaveBeenCalledWith(ORDER_TYPE_URL);
      expect(result).toHaveLength(4);
      expect(result).toEqual([
        {
          code: 'GLU',
          display: 'Glucose',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: 'CREAT',
          display: 'Creatinine',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: 'CBC',
          display: 'Complete Blood Count',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: 'CXR',
          display: 'Chest X-Ray',
          category: 'Radiology Order',
          categoryCode: 'radiology-order-type-uuid',
        },
      ]);
    });

    it('should handle empty expansion contains', async () => {
      const emptyValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'empty-valueset',
        status: 'active',
        expansion: {
          timestamp: '2024-01-01T00:00:00Z',
          contains: [],
        },
      };

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        emptyValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      expect(result).toEqual([]);
    });

    it('should handle missing expansion property', async () => {
      const noExpansionValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'no-expansion-valueset',
        status: 'active',
      };

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        noExpansionValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      expect(result).toEqual([]);
    });

    it('should handle missing code or display values', async () => {
      const incompleteValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'incomplete-valueset',
        status: 'active',
        expansion: {
          timestamp: '2024-01-01T00:00:00Z',
          contains: [
            {
              // Missing code
              display: 'Laboratory',
              contains: [
                {
                  code: 'BIOCHEM',
                  display: 'Biochemistry',
                  contains: [
                    {
                      // Missing display
                      code: 'GLU',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'LabTest',
                        },
                      ],
                    },
                    {
                      // Missing code
                      display: 'Creatinine',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'LabTest',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        incompleteValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      expect(result).toEqual([
        {
          code: 'GLU',
          display: 'Unknown investigation',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: '',
          display: 'Creatinine',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
      ]);
    });

    it('should handle API errors from concept service', async () => {
      const mockError = new Error('Concept API Error');

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockRejectedValue(
        mockError,
      );
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);

      await expect(getFlattenedInvestigations()).rejects.toThrow(mockError);
    });

    it('should handle API errors from order type service', async () => {
      const mockError = new Error('Order Type API Error');

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        mockValueSet,
      );
      (api.get as jest.Mock).mockRejectedValue(mockError);

      await expect(getFlattenedInvestigations()).rejects.toThrow(mockError);
    });

    it('should handle categories without subcategories', async () => {
      const noSubcategoryValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'no-subcategory-valueset',
        status: 'active',
        expansion: {
          timestamp: '2024-01-01T00:00:00Z',
          contains: [
            {
              code: 'LAB',
              display: 'Laboratory',
              contains: [
                {
                  code: 'BIOCHEM',
                  display: 'Biochemistry',
                  // No contains property - no investigations
                },
              ],
            },
          ],
        },
      };

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        noSubcategoryValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      expect(result).toEqual([]);
    });

    it('should handle deeply nested investigations correctly', async () => {
      const deeplyNestedValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'deeply-nested-valueset',
        status: 'active',
        expansion: {
          timestamp: '2024-01-01T00:00:00Z',
          contains: [
            {
              code: 'LAB',
              display: 'Laboratory',
              contains: [
                {
                  code: 'BIOCHEM',
                  display: 'Biochemistry',
                  contains: [
                    {
                      code: 'GLU',
                      display: 'Glucose',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'LabTest',
                        },
                      ],
                    },
                    {
                      code: 'LIPID',
                      display: 'Lipid Panel',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'LabTest',
                        },
                      ],
                    },
                  ],
                },
                {
                  code: 'MICRO',
                  display: 'Microbiology',
                  contains: [
                    {
                      code: 'CULTURE',
                      display: 'Culture',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'Test',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              code: 'RAD',
              display: 'Radiology',
              contains: [
                {
                  code: 'CT',
                  display: 'CT Scan',
                  contains: [
                    {
                      code: 'CT_HEAD',
                      display: 'CT Head',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'Radiology/Imaging Procedure',
                        },
                      ],
                    },
                    {
                      code: 'CT_CHEST',
                      display: 'CT Chest',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'Radiology/Imaging Procedure',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        deeplyNestedValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      expect(result).toHaveLength(5);
      expect(result).toEqual([
        {
          code: 'GLU',
          display: 'Glucose',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: 'LIPID',
          display: 'Lipid Panel',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: 'CULTURE',
          display: 'Culture',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: 'CT_HEAD',
          display: 'CT Head',
          category: 'Radiology Order',
          categoryCode: 'radiology-order-type-uuid',
        },
        {
          code: 'CT_CHEST',
          display: 'CT Chest',
          category: 'Radiology Order',
          categoryCode: 'radiology-order-type-uuid',
        },
      ]);
    });

    it('should append (Panel) to investigations with LabSet concept class', async () => {
      const panelValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'panel-valueset',
        status: 'active',
        expansion: {
          timestamp: '2024-01-01T00:00:00Z',
          contains: [
            {
              code: 'LAB',
              display: 'Laboratory',
              contains: [
                {
                  code: 'BIOCHEM',
                  display: 'Biochemistry',
                  contains: [
                    {
                      code: 'LIPID_PANEL',
                      display: 'Lipid Panel',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: PANEL_CONCEPT_CLASS_NAME,
                        },
                      ],
                    },
                    {
                      code: 'GLU',
                      display: 'Glucose',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'LabTest',
                        },
                      ],
                    },
                    {
                      code: 'LIVER_PANEL',
                      display: 'Liver Function Tests',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: PANEL_CONCEPT_CLASS_NAME,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const panelOrderTypeResponse: OrderTypeResponse = {
        results: [
          {
            uuid: 'lab-order-type-uuid',
            display: 'Lab Order',
            conceptClasses: [
              { uuid: 'test-class-uuid', name: 'Test' },
              { uuid: 'labtest-class-uuid', name: 'LabTest' },
              { uuid: 'labset-class-uuid', name: PANEL_CONCEPT_CLASS_NAME },
            ],
          },
        ],
      };

      // Mock i18next to return the translation key
      (i18next.t as unknown as jest.Mock).mockImplementation((key: string) => {
        if (key === 'INVESTIGATION_PANEL') {
          return 'Panel';
        }
        return key;
      });

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        panelValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(panelOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      // Verify that i18next.t was called with the correct key for panels
      expect(i18next.t).toHaveBeenCalledWith('INVESTIGATION_PANEL');

      // Verify the results
      expect(result).toHaveLength(3);
      expect(result).toEqual([
        {
          code: 'LIPID_PANEL',
          display: 'Lipid Panel (Panel)',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: 'GLU',
          display: 'Glucose',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
        {
          code: 'LIVER_PANEL',
          display: 'Liver Function Tests (Panel)',
          category: 'Lab Order',
          categoryCode: 'lab-order-type-uuid',
        },
      ]);
    });

    it('should handle empty order type response', async () => {
      const emptyOrderTypeResponse: OrderTypeResponse = {
        results: [],
      };

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        mockValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(emptyOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      expect(result).toEqual([]);
    });

    it('should handle duplicate investigations with same code and category', async () => {
      const duplicateValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'duplicate-valueset',
        status: 'active',
        expansion: {
          timestamp: '2024-01-01T00:00:00Z',
          contains: [
            {
              code: 'LAB',
              display: 'Laboratory',
              contains: [
                {
                  code: 'BIOCHEM',
                  display: 'Biochemistry',
                  contains: [
                    {
                      code: 'GLU',
                      display: 'Glucose',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'LabTest',
                        },
                      ],
                    },
                  ],
                },
                {
                  code: 'HEMA',
                  display: 'Hematology',
                  contains: [
                    {
                      code: 'GLU',
                      display: 'Glucose Test',
                      extension: [
                        {
                          url: FHIR_CONCEPT_CLASS_EXTENSION_URL,
                          valueString: 'LabTest',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        duplicateValueSet,
      );
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);

      const result = await getFlattenedInvestigations();

      // Should only have one GLU investigation
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('GLU');
    });
  });

  describe('getCategoryUuidFromOrderTypes', () => {
    const mockOrderTypeResponse: OrderTypeResponse = {
      results: [
        {
          uuid: 'lab-order-uuid',
          display: 'Lab Order',
          conceptClasses: [],
        },
        {
          uuid: 'radiology-order-uuid',
          display: 'Radiology Order',
          conceptClasses: [],
        },
        {
          uuid: 'procedure-order-uuid',
          display: 'Procedure Order',
          conceptClasses: [],
        },
      ],
    };

    beforeEach(() => {
      (api.get as jest.Mock).mockResolvedValue(mockOrderTypeResponse);
    });

    it('should return uuid when category name matches (case insensitive)', async () => {
      const result = await getCategoryUuidFromOrderTypes('Lab Order');
      expect(result).toBe('lab-order-uuid');
    });

    it('should return undefined when category name is not found', async () => {
      const result = await getCategoryUuidFromOrderTypes('Non Existent Order');
      expect(result).toBeUndefined();
    });

    it('should return undefined when category name is undefined', async () => {
      const result = await getCategoryUuidFromOrderTypes(undefined);
      expect(result).toBeUndefined();
    });
  });
});
