import { getUniqueServiceRequests } from '../serviceRequestUtils';

describe('getUniqueServiceRequests', () => {
  const createServiceRequestEntry = (
    conceptCode: string,
    encounterRef: string,
    requesterRef: string,
    id: string = 'sr-' + Math.random().toString(36).substring(7),
  ) => ({
    resource: {
      resourceType: 'ServiceRequest' as const,
      id,
      status: 'active' as const,
      intent: 'order' as const,
      subject: { reference: 'Patient/patient-1' },
      code: {
        coding: [{ code: conceptCode }],
        text: conceptCode,
      },
      encounter: { reference: encounterRef },
      requester: { reference: requesterRef },
    },
  });

  const createImagingStudyEntry = (id: string) => ({
    resource: {
      resourceType: 'ImagingStudy' as const,
      id,
      status: 'available' as const,
      subject: { reference: 'Patient/patient-1' },
    },
  });

  it('should remove duplicate ServiceRequests with same concept, encounter, and requester', () => {
    const entries = [
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-1',
      ),
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-2',
      ),
    ];

    const result = getUniqueServiceRequests(entries);

    expect(result).toHaveLength(1);
    expect(result[0].resource?.id).toBe('sr-1');
  });

  it('should keep ServiceRequests with different concept codes', () => {
    const entries = [
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-1',
      ),
      createServiceRequestEntry(
        'CBC',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-2',
      ),
    ];

    const result = getUniqueServiceRequests(entries);

    expect(result).toHaveLength(2);
  });

  it('should keep ServiceRequests from different encounters', () => {
    const entries = [
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-1',
      ),
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-2',
        'Practitioner/prac-1',
        'sr-2',
      ),
    ];

    const result = getUniqueServiceRequests(entries);

    expect(result).toHaveLength(2);
  });

  it('should keep ServiceRequests from different requesters', () => {
    const entries = [
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-1',
      ),
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-1',
        'Practitioner/prac-2',
        'sr-2',
      ),
    ];

    const result = getUniqueServiceRequests(entries);

    expect(result).toHaveLength(2);
  });

  it('should perform case-insensitive deduplication', () => {
    const entries = [
      createServiceRequestEntry(
        'Blood_Glucose',
        'Encounter/ENC-1',
        'Practitioner/PRAC-1',
        'sr-1',
      ),
      createServiceRequestEntry(
        'blood_glucose',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-2',
      ),
    ];

    const result = getUniqueServiceRequests(entries);

    expect(result).toHaveLength(1);
  });

  it('should preserve non-ServiceRequest resources (e.g., ImagingStudy)', () => {
    const entries = [
      createServiceRequestEntry(
        'XRAY_CHEST',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-1',
      ),
      createImagingStudyEntry('img-1') as any,
      createServiceRequestEntry(
        'XRAY_CHEST',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-2',
      ),
      createImagingStudyEntry('img-2') as any,
    ];

    const result = getUniqueServiceRequests(entries);

    expect(result).toHaveLength(3);
    expect(
      result.filter((e: any) => e.resource?.resourceType === 'ServiceRequest'),
    ).toHaveLength(1);
    expect(
      result.filter((e: any) => e.resource?.resourceType === 'ImagingStudy'),
    ).toHaveLength(2);
  });

  it('should handle empty array', () => {
    const result = getUniqueServiceRequests([]);
    expect(result).toEqual([]);
  });

  it('should handle null/undefined entries', () => {
    const result = getUniqueServiceRequests(null as any);
    expect(result).toEqual([]);
  });

  it('should handle entries with missing fields gracefully', () => {
    const entries = [
      {
        resource: {
          resourceType: 'ServiceRequest' as const,
          id: 'sr-1',
          status: 'active' as const,
          intent: 'order' as const,
          subject: { reference: 'Patient/p1' },
        },
      },
      {
        resource: {
          resourceType: 'ServiceRequest' as const,
          id: 'sr-2',
          status: 'active' as const,
          intent: 'order' as const,
          subject: { reference: 'Patient/p1' },
        },
      },
    ];

    const result = getUniqueServiceRequests(entries);

    // Both have the same empty key (no code, encounter, or requester), so only first is kept
    expect(result).toHaveLength(1);
    expect(result[0].resource?.id).toBe('sr-1');
  });

  it('should handle multiple groups of duplicates', () => {
    const entries = [
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-1',
      ),
      createServiceRequestEntry(
        'CBC',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-2',
      ),
      createServiceRequestEntry(
        'BLOOD_GLUCOSE',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-3',
      ),
      createServiceRequestEntry(
        'CBC',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-4',
      ),
      createServiceRequestEntry(
        'XRAY',
        'Encounter/enc-1',
        'Practitioner/prac-1',
        'sr-5',
      ),
    ];

    const result = getUniqueServiceRequests(entries);

    expect(result).toHaveLength(3);
    expect(result.map((e: any) => e.resource?.id)).toEqual([
      'sr-1',
      'sr-2',
      'sr-5',
    ]);
  });
});
