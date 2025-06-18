import { ValueSet } from 'fhir/r4';
import { getFlattenedInvestigations } from '../investigationService';
import * as conceptService from '../conceptService';
import { ALL_ORDERABLES_CONCEPT_NAME } from '@constants/app';

jest.mock('../conceptService');

describe('investigationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFlattenedInvestigations', () => {
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
                  },
                  {
                    code: 'CREAT',
                    display: 'Creatinine',
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

      const result = await getFlattenedInvestigations();

      expect(conceptService.searchFHIRConceptsByName).toHaveBeenCalledWith(
        ALL_ORDERABLES_CONCEPT_NAME,
      );
      expect(result).toHaveLength(4);
      expect(result).toEqual([
        {
          code: 'GLU',
          display: 'Glucose',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
        {
          code: 'CREAT',
          display: 'Creatinine',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
        {
          code: 'CBC',
          display: 'Complete Blood Count',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
        {
          code: 'CXR',
          display: 'Chest X-Ray',
          category: 'Radiology',
          categoryCode: 'RAD',
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
                    },
                    {
                      // Missing code
                      display: 'Creatinine',
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

      const result = await getFlattenedInvestigations();

      expect(result).toEqual([
        {
          code: 'GLU',
          display: 'Unknown investigation',
          category: 'Laboratory',
          categoryCode: '',
        },
        {
          code: '',
          display: 'Creatinine',
          category: 'Laboratory',
          categoryCode: '',
        },
      ]);
    });

    it('should handle missing category display', async () => {
      const noCategoryDisplayValueSet: ValueSet = {
        resourceType: 'ValueSet',
        id: 'no-category-display-valueset',
        status: 'active',
        expansion: {
          timestamp: '2024-01-01T00:00:00Z',
          contains: [
            {
              code: 'LAB',
              // Missing display
              contains: [
                {
                  code: 'BIOCHEM',
                  display: 'Biochemistry',
                  contains: [
                    {
                      code: 'GLU',
                      display: 'Glucose',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockResolvedValue(
        noCategoryDisplayValueSet,
      );

      const result = await getFlattenedInvestigations();

      expect(result).toEqual([
        {
          code: 'GLU',
          display: 'Glucose',
          category: 'Unknown Category',
          categoryCode: 'LAB',
        },
      ]);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');

      (conceptService.searchFHIRConceptsByName as jest.Mock).mockRejectedValue(
        mockError,
      );

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
                    },
                    {
                      code: 'LIPID',
                      display: 'Lipid Panel',
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
                    },
                    {
                      code: 'CT_CHEST',
                      display: 'CT Chest',
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

      const result = await getFlattenedInvestigations();

      expect(result).toHaveLength(5);
      expect(result).toEqual([
        {
          code: 'GLU',
          display: 'Glucose',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
        {
          code: 'LIPID',
          display: 'Lipid Panel',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
        {
          code: 'CULTURE',
          display: 'Culture',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
        {
          code: 'CT_HEAD',
          display: 'CT Head',
          category: 'Radiology',
          categoryCode: 'RAD',
        },
        {
          code: 'CT_CHEST',
          display: 'CT Chest',
          category: 'Radiology',
          categoryCode: 'RAD',
        },
      ]);
    });
  });
});
