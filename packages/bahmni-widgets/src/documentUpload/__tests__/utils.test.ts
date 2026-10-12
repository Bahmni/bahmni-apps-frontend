import { PendingDocument } from '../models';
import { getDefaultDocumentType, revokeDocumentPreview } from '../utils';

const TYPES = [
  { id: 'type-1', label: 'Lab Report' },
  { id: 'type-2', label: 'Prescription' },
];

describe('getDefaultDocumentType', () => {
  it('picks the configured default option, ignoring case and surrounding spaces', () => {
    expect(getDefaultDocumentType(TYPES, ' prescription ')).toEqual(TYPES[1]);
  });

  it('falls back to the first type when the default option is not one of them', () => {
    expect(getDefaultDocumentType(TYPES, 'Discharge Summary')).toEqual(
      TYPES[0],
    );
    expect(getDefaultDocumentType(TYPES)).toEqual(TYPES[0]);
  });

  it('has no default when there are no types', () => {
    expect(getDefaultDocumentType([], 'Prescription')).toBeNull();
  });
});

describe('revokeDocumentPreview', () => {
  beforeEach(() => {
    global.URL.revokeObjectURL = jest.fn();
  });

  it('releases a local blob preview', () => {
    revokeDocumentPreview({
      url: 'blob:http://localhost/1',
    } as PendingDocument);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/1');
  });

  it('leaves a non-blob url alone', () => {
    revokeDocumentPreview({ url: 'patient/doc.png' } as PendingDocument);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });
});
