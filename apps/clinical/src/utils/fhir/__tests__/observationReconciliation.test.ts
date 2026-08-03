import {
  extractVersionFromFormFieldPath,
  injectMissingDeleteObs,
  markUnchangedObservations,
  mergeObservationStatuses,
  restoreComplexValues,
  valueFingerprint,
} from '../observationReconciliation';

describe('extractVersionFromFormFieldPath', () => {
  it('extracts version from a standard formFieldPath', () => {
    expect(extractVersionFromFormFieldPath('Vitals.18/14-0')).toBe('18');
  });

  it('extracts version from a formFieldPath with a single-digit version', () => {
    expect(extractVersionFromFormFieldPath('Vitals.1/14-0')).toBe('1');
  });

  it('extracts version from a formFieldPath with a multi-word form name', () => {
    expect(
      extractVersionFromFormFieldPath('History and Examination.2/3-0'),
    ).toBe('2');
  });

  it('returns null when formFieldPath is undefined', () => {
    expect(extractVersionFromFormFieldPath(undefined)).toBeNull();
  });

  it('returns null when formFieldPath has no slash', () => {
    expect(extractVersionFromFormFieldPath('Vitals.1')).toBeNull();
  });

  it('returns null when formFieldPath has no dot before the slash', () => {
    expect(extractVersionFromFormFieldPath('Vitals/14-0')).toBeNull();
  });

  it('returns null when the version segment is empty', () => {
    expect(extractVersionFromFormFieldPath('Vitals./14-0')).toBeNull();
  });
});

describe('valueFingerprint', () => {
  it('returns empty string for null', () => {
    expect(valueFingerprint(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(valueFingerprint(undefined)).toBe('');
  });

  it('returns date: prefix for a Date object', () => {
    const d = new Date('2024-03-15');
    expect(valueFingerprint(d)).toBe('date:2024-03-15');
  });

  it('returns date: prefix for a date-only string', () => {
    expect(valueFingerprint('2024-03-15')).toBe('date:2024-03-15');
  });

  it('includes the time-of-day for an ISO datetime string', () => {
    expect(valueFingerprint('2024-03-15T10:00:00Z')).toBe(
      'date:2024-03-15 10:00',
    );
  });

  it('distinguishes two datetime values that only differ by time', () => {
    expect(valueFingerprint('2024-03-15 10:00:00')).not.toBe(
      valueFingerprint('2024-03-15 13:00:00'),
    );
  });

  it('does not treat plain numeric string as date', () => {
    expect(valueFingerprint('2024')).toBe('2024');
  });

  it('returns uuid: prefix for object with uuid', () => {
    expect(valueFingerprint({ uuid: 'abc-123', display: 'Foo' })).toBe(
      'uuid:abc-123',
    );
  });

  it('returns url string for Complex object with url', () => {
    expect(
      valueFingerprint({ url: '/images/photo.jpg', fileName: 'photo.jpg' }),
    ).toBe('/images/photo.jpg');
  });

  it('returns plain string as-is', () => {
    expect(valueFingerprint('hello world')).toBe('hello world');
  });

  it('returns JSON.stringify for unknown object', () => {
    expect(valueFingerprint({ foo: 'bar' })).toBe('{"foo":"bar"}');
  });
});

describe('injectMissingDeleteObs', () => {
  const obs = (uuid: string, value: string | null = 'val') => ({
    concept: { uuid: 'c1' },
    value,
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
  });

  it('injects voided entry for obs present in original but absent from transformed', () => {
    const transformed = [obs('obs-1')];
    const original = [obs('obs-1'), obs('obs-2')];
    injectMissingDeleteObs(transformed, original);
    expect(transformed).toHaveLength(2);
    const injected = transformed.find((o) => o.uuid === 'obs-2');
    expect(injected?.voided).toBe(true);
    expect(injected?.value).toBeNull();
  });

  it('does not inject when all original obs are present in transformed', () => {
    const transformed = [obs('obs-1'), obs('obs-2')];
    const original = [obs('obs-1'), obs('obs-2')];
    injectMissingDeleteObs(transformed, original);
    expect(transformed).toHaveLength(2);
  });
});

describe('restoreComplexValues', () => {
  it('restores ComplexValue object from source when transformed has plain URL string', () => {
    const complexVal = { url: '/images/photo.jpg', fileName: 'photo.jpg' };
    const transformed = [
      {
        concept: { uuid: 'c1' },
        value: '/images/photo.jpg',
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    const source = [
      {
        concept: { uuid: 'c1' },
        value: complexVal,
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    restoreComplexValues(transformed, source);
    expect(transformed[0].value).toEqual(complexVal);
  });

  it('leaves value unchanged when no matching URL in source', () => {
    const transformed = [
      {
        concept: { uuid: 'c1' },
        value: '/other/path.jpg',
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    const source = [
      {
        concept: { uuid: 'c1' },
        value: { url: '/images/photo.jpg', fileName: 'photo.jpg' },
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    restoreComplexValues(transformed, source);
    expect(transformed[0].value).toBe('/other/path.jpg');
  });
});

describe('mergeObservationStatuses', () => {
  const obs = (uuid: string, status?: string) => ({
    concept: { uuid: 'c1' },
    value: 'val',
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
    status,
  });

  it('copies status from existing to transformed when uuids match', () => {
    const transformed = [obs('obs-1')];
    const existing = [obs('obs-1', 'final')];
    mergeObservationStatuses(transformed, existing);
    expect(transformed[0].status).toBe('final');
  });

  it('does not overwrite status when existing has none', () => {
    const transformed = [obs('obs-1', 'amended')];
    const existing = [obs('obs-1')];
    mergeObservationStatuses(transformed, existing);
    expect(transformed[0].status).toBe('amended');
  });

  it('skips obs without uuid', () => {
    const transformed = [
      {
        concept: { uuid: 'c1' },
        value: 'v',
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    const existing = [obs('obs-1', 'final')];
    mergeObservationStatuses(transformed, existing);
    expect((transformed[0] as { status?: string }).status).toBeUndefined();
  });

  it('recurses into group members', () => {
    const child = obs('child-1');
    const existingChild = obs('child-1', 'amended');
    const transformed = [{ ...obs('grp-1'), groupMembers: [child] }];
    const existing = [
      { ...obs('grp-1', 'final'), groupMembers: [existingChild] },
    ];
    mergeObservationStatuses(transformed, existing);
    expect(transformed[0].status).toBe('final');
    expect(child.status).toBe('amended');
  });
});

describe('markUnchangedObservations', () => {
  const obs = (
    uuid: string,
    value: unknown,
    extra: Record<string, unknown> = {},
  ) => ({
    concept: { uuid: 'c1' },
    value,
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
    ...extra,
  });

  it('marks an obs unchanged when value, comment, and interpretation exactly match', () => {
    const transformed = [obs('obs-1', 2)];
    const original = [obs('obs-1', 2)];
    markUnchangedObservations(transformed, original);
    expect(transformed[0].unchanged).toBe(true);
  });

  it('does not mark an obs unchanged when the value differs', () => {
    const transformed = [obs('obs-1', 6)];
    const original = [obs('obs-1', 2)];
    markUnchangedObservations(transformed, original);
    expect(transformed[0].unchanged).toBeUndefined();
  });

  it('treats interpretation case-insensitively (getValue() echoes uppercase codes; FHIR fetch returns display strings)', () => {
    // Regression: getValue() returns uppercase codes ("ABNORMAL") but the FHIR snapshot holds display strings ("Abnormal").
    const transformed = [obs('obs-1', 2, { interpretation: 'ABNORMAL' })];
    const original = [obs('obs-1', 2, { interpretation: 'Abnormal' })];
    markUnchangedObservations(transformed, original);
    expect(transformed[0].unchanged).toBe(true);
  });

  it('does not mark an obs unchanged when the comment differs', () => {
    const transformed = [obs('obs-1', 2, { comment: 'new note' })];
    const original = [obs('obs-1', 2)];
    markUnchangedObservations(transformed, original);
    expect(transformed[0].unchanged).toBeUndefined();
  });

  it('does not mark voided obs as unchanged', () => {
    const transformed = [obs('obs-1', 2, { voided: true })];
    const original = [obs('obs-1', 2)];
    markUnchangedObservations(transformed, original);
    expect(transformed[0].unchanged).toBeUndefined();
  });

  it('recurses into group members, marking only the ones that match', () => {
    const changedChild = obs('child-1', 6);
    const unchangedChild = obs('child-2', 3);
    const transformed = [
      { ...obs('grp-1', null), groupMembers: [changedChild, unchangedChild] },
    ];
    const original = [
      {
        ...obs('grp-1', null),
        groupMembers: [obs('child-1', 2), obs('child-2', 3)],
      },
    ];
    markUnchangedObservations(transformed, original);
    expect(changedChild.unchanged).toBeUndefined();
    expect(unchangedChild.unchanged).toBe(true);
  });
});
