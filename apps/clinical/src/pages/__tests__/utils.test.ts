import { hasRequiredPrivileges } from '@bahmni/services';
import {
  validFullClinicalConfig,
  validDashboardConfig,
} from '../../__mocks__/configMocks';
import { Dashboard } from '../../providers/clinicalConfig/models';
import { DashboardConfig, DashboardSectionConfig } from '../models';
import {
  getDefaultDashboard,
  getSidebarItems,
  filterControlsByPrivileges,
  filterSectionsByPrivileges,
} from '../util';

const mockTranslation = jest.fn((key: string) => key);

describe('ConsultationPageService', () => {
  describe('getDefaultDashboard', () => {
    it('should return the default dashboard when one exists', () => {
      const result = getDefaultDashboard(validFullClinicalConfig.dashboards);
      expect(result).toEqual(validFullClinicalConfig.dashboards[0]);
    });

    it('should return the first dashboard when no default dashboard exists', () => {
      const dashboardsWithNoDefault: Dashboard[] =
        validFullClinicalConfig.dashboards.map((dashboard) => ({
          ...dashboard,
          default: false,
        }));
      const result = getDefaultDashboard(dashboardsWithNoDefault);
      expect(result).toEqual(dashboardsWithNoDefault[0]);
    });

    it('should return null for empty dashboards array', () => {
      const result = getDefaultDashboard([]);
      expect(result).toBeNull();
    });
  });

  describe('hasRequiredPrivileges', () => {
    const userPrivileges = [{ name: 'Add Allergies' }, { name: 'Add Orders' }];

    it('returns true when no required privileges are defined', () => {
      expect(hasRequiredPrivileges(userPrivileges, undefined)).toBe(true);
      expect(hasRequiredPrivileges(userPrivileges, [])).toBe(true);
    });

    it('returns true when user has the required privilege', () => {
      expect(hasRequiredPrivileges(userPrivileges, ['Add Allergies'])).toBe(
        true,
      );
    });

    it('returns false when user does not have the required privilege', () => {
      expect(hasRequiredPrivileges(userPrivileges, ['Add Medications'])).toBe(
        false,
      );
    });

    it('returns false when user privileges are null', () => {
      expect(hasRequiredPrivileges(null, ['Add Allergies'])).toBe(false);
    });

    it('returns true only when user has ALL required privileges', () => {
      expect(
        hasRequiredPrivileges(userPrivileges, ['Add Allergies', 'Add Orders']),
      ).toBe(true);
    });

    it('returns false when user has some but not all required privileges', () => {
      expect(
        hasRequiredPrivileges(userPrivileges, [
          'Add Allergies',
          'Add Medications',
        ]),
      ).toBe(false);
    });
  });

  describe('filterControlsByPrivileges', () => {
    const userPrivileges = [{ name: 'Add Allergies' }];

    it('includes control when user has the required privilege', () => {
      const controls = [
        {
          type: 'widget',
          name: 'allergies',
          requiredPrivileges: ['Add Allergies'],
        },
      ];
      const result = filterControlsByPrivileges(userPrivileges, controls);
      expect(result).toHaveLength(1);
    });

    it('excludes control when user lacks the required privilege', () => {
      const controls = [
        {
          type: 'widget',
          name: 'medications',
          requiredPrivileges: ['Add Medications'],
        },
      ];
      const result = filterControlsByPrivileges(userPrivileges, controls);
      expect(result).toHaveLength(0);
    });

    it('includes control when no required privileges are defined', () => {
      const controls = [{ type: 'widget', name: 'vitals' }];
      const result = filterControlsByPrivileges(userPrivileges, controls);
      expect(result).toHaveLength(1);
    });
  });

  describe('filterSectionsByPrivileges', () => {
    const userPrivileges = [{ name: 'Add Allergies' }];

    const sections: DashboardSectionConfig[] = [
      {
        id: 'section-1',
        name: 'Section 1',
        icon: 'allergies',
        controls: [
          {
            type: 'widget',
            name: 'allergies',
            requiredPrivileges: ['Add Allergies'],
          },
        ],
      },
      {
        id: 'section-2',
        name: 'Section 2',
        icon: 'pills',
        controls: [
          {
            type: 'widget',
            name: 'medications',
            requiredPrivileges: ['Add Medications'],
          },
        ],
      },
      {
        id: 'section-3',
        name: 'Section 3',
        icon: 'heartbeat',
        controls: [{ type: 'widget', name: 'vitals' }],
      },
    ];

    it('keeps section when user has privilege for at least one control', () => {
      const result = filterSectionsByPrivileges(userPrivileges, sections);
      const ids = result.map((s) => s.id);
      expect(ids).toContain('section-1');
    });

    it('removes section when user lacks privilege for all its controls', () => {
      const result = filterSectionsByPrivileges(userPrivileges, sections);
      const ids = result.map((s) => s.id);
      expect(ids).not.toContain('section-2');
    });

    it('keeps section with no required privileges regardless of user privileges', () => {
      const result = filterSectionsByPrivileges(userPrivileges, sections);
      const ids = result.map((s) => s.id);
      expect(ids).toContain('section-3');
    });

    it('removes all sections when user has no privileges and all controls require privileges', () => {
      const result = filterSectionsByPrivileges(null, [
        sections[0],
        sections[1],
      ]);
      expect(result).toHaveLength(0);
    });

    it('removes sections that originally had empty controls array', () => {
      const sectionsWithEmpty: DashboardSectionConfig[] = [
        {
          id: 'section-empty',
          name: 'Empty Section',
          icon: 'star',
          controls: [],
        },
        {
          id: 'section-with-controls',
          name: 'Has Controls',
          icon: 'heart',
          controls: [{ type: 'widget', name: 'widget1' }],
        },
      ];
      const result = filterSectionsByPrivileges(userPrivileges, sectionsWithEmpty);
      const ids = result.map((s) => s.id);
      expect(ids).toContain('section-with-controls');
      expect(ids).not.toContain('section-empty');
    });
  });

  describe('getSidebarItems', () => {
    beforeEach(() => {
      mockTranslation.mockClear();
    });
    it('should convert dashboard sections to sidebar items', () => {
      const result = getSidebarItems(validDashboardConfig, mockTranslation);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'vitals',
        icon: 'heartbeat',
        label: 'VITALS_SECTION',
      });
      expect(result[1]).toEqual({
        id: 'medications',
        icon: 'pills',
        label: 'Medications',
      });
      expect(mockTranslation).toHaveBeenNthCalledWith(1, 'VITALS_SECTION');
      expect(mockTranslation).toHaveBeenNthCalledWith(2, 'Medications');
    });

    it('should return empty array for empty sections', () => {
      const emptyConfig: DashboardConfig = {
        sections: [],
      };
      const result = getSidebarItems(emptyConfig, mockTranslation);
      expect(result).toEqual([]);
      expect(mockTranslation).not.toHaveBeenCalled();
    });
  });
});
