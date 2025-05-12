import {
  getDefaultDashboard,
  getSidebarItems,
} from '../consultationPageService';
import {
  validFullClinicalConfig,
  validDashboardConfig,
} from '@__mocks__/configMocks';
import { Dashboard } from '@types/config';
import { DashboardConfig } from '@types/dashboardConfig';

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
    it('should convert dashboard sections to sidebar items', () => {
      const result = getSidebarItems(validDashboardConfig);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'vitals',
        icon: 'heartbeat',
        label: 'Vitals',
        active: false,
        action: expect.any(Function),
      });
      expect(result[1]).toEqual({
        id: 'medications',
        icon: 'pills',
        label: 'Medications',
        active: false,
        action: expect.any(Function),
      });
    });

    it('should return empty array for empty sections', () => {
      const emptyConfig: DashboardConfig = {
        sections: [],
      };
      const result = getSidebarItems(emptyConfig);
      expect(result).toEqual([]);
    });
  });
});
