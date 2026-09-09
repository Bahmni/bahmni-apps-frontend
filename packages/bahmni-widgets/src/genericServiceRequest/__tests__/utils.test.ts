import { ServiceRequestStatus } from '../models';
import { getStatusDotClassName } from '../utils';

const mockStyles: Record<string, string> = {
  inProgressStatus: 'inProgressStatus',
  completedStatus: 'completedStatus',
  revokedStatus: 'revokedStatus',
  unknownStatus: 'unknownStatus',
};

describe('getStatusDotClassName', () => {
  it('returns inProgressStatus for Active status', () => {
    expect(getStatusDotClassName(ServiceRequestStatus.Active, mockStyles)).toBe(
      mockStyles.inProgressStatus,
    );
  });

  it('returns completedStatus for Completed status', () => {
    expect(
      getStatusDotClassName(ServiceRequestStatus.Completed, mockStyles),
    ).toBe(mockStyles.completedStatus);
  });

  it('returns revokedStatus for Revoked status', () => {
    expect(
      getStatusDotClassName(ServiceRequestStatus.Revoked, mockStyles),
    ).toBe(mockStyles.revokedStatus);
  });

  it('returns unknownStatus for any unrecognised status', () => {
    expect(getStatusDotClassName('unknown', mockStyles)).toBe(
      mockStyles.unknownStatus,
    );
  });
});
