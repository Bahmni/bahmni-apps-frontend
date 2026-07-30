import {
  detectFormChanges,
  extractVersionFromFormFieldPath,
  injectMissingDeleteObs,
  markUnchangedObservations,
  mergeObservationStatuses,
  replaceInterpretationRemovedObs,
  replaceNoteRemovedObs,
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

  it('returns date: prefix for an ISO date string', () => {
    expect(valueFingerprint('2024-03-15T10:00:00Z')).toBe('date:2024-03-15');
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

describe('detectFormChanges', () => {
  const obs = (formFieldPath: string, value: unknown, comment?: string) => ({
    concept: { uuid: 'c1' },
    value: value as string,
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    formFieldPath,
    comment,
  });

  it('returns false when current and original are identical', () => {
    const current = [obs('Form.1/1-0', 'hello')];
    const original = [obs('Form.1/1-0', 'hello')];
    expect(detectFormChanges(current, original)).toBe(false);
  });

  it('returns true when a field is added', () => {
    const current = [obs('Form.1/1-0', 'a'), obs('Form.1/2-0', 'b')];
    const original = [obs('Form.1/1-0', 'a')];
    expect(detectFormChanges(current, original)).toBe(true);
  });

  it('returns true when a field is removed', () => {
    const current = [obs('Form.1/1-0', 'a')];
    const original = [obs('Form.1/1-0', 'a'), obs('Form.1/2-0', 'b')];
    expect(detectFormChanges(current, original)).toBe(true);
  });

  it('returns true when a value changes', () => {
    const current = [obs('Form.1/1-0', 'new value')];
    const original = [obs('Form.1/1-0', 'old value')];
    expect(detectFormChanges(current, original)).toBe(true);
  });

  it('returns true when a comment changes', () => {
    const current = [obs('Form.1/1-0', 'val', 'new note')];
    const original = [obs('Form.1/1-0', 'val', 'old note')];
    expect(detectFormChanges(current, original)).toBe(true);
  });

  it('returns false for multiselect with same set in different order', () => {
    const current = [obs('Form.1/1-0', 'b'), obs('Form.1/1-0', 'a')];
    const original = [obs('Form.1/1-0', 'a'), obs('Form.1/1-0', 'b')];
    expect(detectFormChanges(current, original)).toBe(false);
  });

  it('deduplicates duplicate observations at the same path', () => {
    const current = [obs('Form.1/1-0', 'x'), obs('Form.1/1-0', 'x')];
    const original = [obs('Form.1/1-0', 'x')];
    expect(detectFormChanges(current, original)).toBe(false);
  });

  it('recurses into groupMembers', () => {
    const current = [
      {
        ...obs('Form.1/1-0', null),
        groupMembers: [obs('Form.1/2-0', 'changed')],
      },
    ];
    const original = [
      {
        ...obs('Form.1/1-0', null),
        groupMembers: [obs('Form.1/2-0', 'original')],
      },
    ];
    expect(detectFormChanges(current, original)).toBe(true);
  });
});

describe('replaceNoteRemovedObs', () => {
  const obs = (uuid: string, comment?: string) => ({
    concept: { uuid: 'c1' },
    value: 'val',
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
    comment,
  });

  it('replaces obs where comment was cleared with DELETE+POST pair', () => {
    const transformed = [obs('obs-1')]; // no comment now
    const original = [obs('obs-1', 'old note')];
    replaceNoteRemovedObs(transformed, original);
    expect(transformed).toHaveLength(2);
    expect(transformed[0].voided).toBe(true);
    expect(transformed[0].uuid).toBe('obs-1');
    expect(transformed[1].uuid).toBeUndefined();
    expect(transformed[1].comment).toBeUndefined();
  });

  it('does not replace obs that still has a comment', () => {
    const transformed = [obs('obs-1', 'still here')];
    const original = [obs('obs-1', 'old note')];
    replaceNoteRemovedObs(transformed, original);
    expect(transformed).toHaveLength(1);
  });

  it('does not replace obs that had no comment originally', () => {
    const transformed = [obs('obs-1')];
    const original = [obs('obs-1')];
    replaceNoteRemovedObs(transformed, original);
    expect(transformed).toHaveLength(1);
  });

  it('recurses into group members', () => {
    const child = obs('child-1');
    const originalChild = obs('child-1', 'old note');
    const transformed = [{ ...obs('grp-1'), groupMembers: [child] }];
    const original = [{ ...obs('grp-1'), groupMembers: [originalChild] }];
    replaceNoteRemovedObs(transformed, original);
    const groupMembers = transformed[0].groupMembers as (typeof child)[];
    expect(groupMembers).toHaveLength(2);
    expect(groupMembers[0].voided).toBe(true);
    expect(groupMembers[0].uuid).toBe('child-1');
    expect(groupMembers[1].uuid).toBeUndefined();
    expect(groupMembers[1].comment).toBeUndefined();
  });
});

describe('replaceInterpretationRemovedObs', () => {
  const obs = (uuid: string, interpretation?: string) => ({
    concept: { uuid: 'c1' },
    value: 80,
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
    interpretation,
  });

  it('replaces obs where interpretation was cleared', () => {
    const transformed = [obs('obs-1')];
    const original = [obs('obs-1', 'ABNORMAL')];
    replaceInterpretationRemovedObs(transformed, original);
    expect(transformed).toHaveLength(2);
    expect(transformed[0].voided).toBe(true);
    expect(transformed[1].uuid).toBeUndefined();
    expect(transformed[1].interpretation).toBeUndefined();
  });

  it('recurses into group members', () => {
    const child = obs('child-1');
    const originalChild = obs('child-1', 'HIGH');
    const transformed = [{ ...obs('grp-1'), groupMembers: [child] }];
    const original = [{ ...obs('grp-1'), groupMembers: [originalChild] }];
    replaceInterpretationRemovedObs(transformed, original);
    const groupMembers = transformed[0].groupMembers as (typeof child)[];
    expect(groupMembers).toHaveLength(2);
    expect(groupMembers[0].voided).toBe(true);
  });

  it('leaves obs unchanged when interpretation is still present', () => {
    const transformed = [obs('obs-1', 'NORMAL')];
    const original = [obs('obs-1', 'NORMAL')];
    replaceInterpretationRemovedObs(transformed, original);
    expect(transformed).toHaveLength(1);
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
