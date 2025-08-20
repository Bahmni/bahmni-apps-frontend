import { Dashboard, DashboardConfig } from '@bahmni-frontend/bahmni-services';
import {
  validFullClinicalConfig,
  validDashboardConfig,
} from '../../__mocks__/configMocks';
import {
  getDefaultDashboard,
  getSidebarItems,
} from '../consultationPageService';

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
