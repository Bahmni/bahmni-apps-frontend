import { createEncounterBundle, uploadDocument } from '@bahmni/services';
import * as encounterBundleService from '../../../services/encounterBundleService';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import * as conceptExtractor from '../../../utils/fhir/conceptExtractor';
import * as encounterResourceCreator from '../../../utils/fhir/encounterResourceCreator';
import '../../forms/documents';
import {
  CONSENT_FORM_TYPE,
  createBlankDocumentEntry,
  createPendingDocument,
} from '../../forms/documents/__tests__/__mocks__/documentsMocks';
import { useDocumentsStore } from '../../forms/documents/store';
import { getRegisteredInputControls } from '../../forms/registry';
import { submitConsultation } from '../services';
import { getActiveEntries } from '../utils';
import {
  mockBundle,
  mockEncounterBundleEntry,
  mockEncounterResource,
  mockFormEntry,
  mockResponseBundle,
  mockStoreState,
  mockUpdatedConcepts,
} from './__mocks__/servicesMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createEncounterBundle: jest.fn(),
  uploadDocument: jest.fn(),
}));
jest.mock('../../../stores/encounterDetailsStore');
jest.mock('../../../services/encounterBundleService');
jest.mock('../../../utils/fhir/encounterResourceCreator');
jest.mock('../../../utils/fhir/conceptExtractor');

const mockCreateEncounterResource = jest.mocked(
  encounterResourceCreator.createEncounterResource,
);
const mockCreateEncounterBundleEntry = jest.mocked(
  encounterBundleService.createEncounterBundleEntry,
);
const mockGetEncounterReference = jest.mocked(
  encounterBundleService.getEncounterReference,
);
const mockCreateEncounterBundle = jest.mocked(createEncounterBundle);
const mockPostEncounterBundle = jest.mocked(
  encounterBundleService.postEncounterBundle,
);
const mockExtractConcepts = jest.mocked(
  conceptExtractor.extractConceptsFromResponseBundle,
);

beforeEach(() => {
  (useEncounterDetailsStore as unknown as { getState: jest.Mock }).getState =
    jest.fn().mockReturnValue(mockStoreState);

  mockCreateEncounterResource.mockReturnValue(mockEncounterResource);
  mockCreateEncounterBundleEntry.mockReturnValue(mockEncounterBundleEntry);
  mockGetEncounterReference.mockReturnValue('urn:uuid:encounter-entry-id');
  mockCreateEncounterBundle.mockReturnValue(mockBundle);
  mockPostEncounterBundle.mockResolvedValue(mockResponseBundle);
  mockExtractConcepts.mockReturnValue(mockUpdatedConcepts);
});

describe('submitConsultation', () => {
  it('returns updatedConcepts, patientUUID, and encounterTypeName from store state', async () => {
    const result = await submitConsultation({
      activeEncounter: null,
      episodeOfCareUuids: ['episode-uuid'],
      activeEntries: [],
    });

    expect(result).toEqual({
      updatedConcepts: mockUpdatedConcepts,
      patientUUID: 'patient-uuid',
      encounterTypeName: 'OPD',
    });
  });

  it('posts the consultation bundle and extracts concepts from the response', async () => {
    await submitConsultation({
      activeEncounter: null,
      episodeOfCareUuids: [],
      activeEntries: [],
    });

    expect(mockPostEncounterBundle).toHaveBeenCalledWith(mockBundle);
    expect(mockExtractConcepts).toHaveBeenCalledWith(mockResponseBundle);
  });

  it('includes bundle entries only from form entries that have data and createBundleEntries', async () => {
    const entryWithData = mockFormEntry();
    const entryWithoutData = mockFormEntry({
      hasData: jest.fn().mockReturnValue(false),
    });
    const entryWithoutBundleFn = mockFormEntry({
      createBundleEntries: undefined,
    });

    await submitConsultation({
      activeEncounter: null,
      episodeOfCareUuids: [],
      activeEntries: [entryWithData, entryWithoutData, entryWithoutBundleFn],
    });

    expect(entryWithData.createBundleEntries).toHaveBeenCalled();
    expect(entryWithoutData.createBundleEntries).not.toHaveBeenCalled();
    expect(mockCreateEncounterBundle).toHaveBeenCalledWith([
      mockEncounterBundleEntry,
      { fullUrl: 'urn:uuid:obs-1', resource: { resourceType: 'Observation' } },
    ]);
  });

  it('passes statDurationInMilliseconds in the BundleContext to form entries', async () => {
    const entry = mockFormEntry();

    await submitConsultation({
      activeEncounter: null,
      episodeOfCareUuids: [],
      statDurationInMilliseconds: 5000,
      activeEntries: [entry],
    });

    expect(entry.createBundleEntries).toHaveBeenCalledWith(
      expect.objectContaining({ statDurationInMilliseconds: 5000 }),
    );
  });

  it('lets a form entry finish its preparation before its bundle entries are built', async () => {
    const order: string[] = [];
    const entry = mockFormEntry({
      prepareBundleEntries: jest.fn(async () => {
        await Promise.resolve();
        order.push('prepared');
      }),
      createBundleEntries: jest.fn(() => {
        order.push('built');
        return [];
      }),
    });

    await submitConsultation({
      activeEncounter: null,
      episodeOfCareUuids: [],
      activeEntries: [entry],
    });

    expect(order).toEqual(['prepared', 'built']);
  });

  it('saves nothing when an entry fails to prepare, whatever the other entries hold', async () => {
    mockPostEncounterBundle.mockClear();
    const failing = mockFormEntry({
      prepareBundleEntries: jest
        .fn()
        .mockRejectedValue(new Error('Upload failed')),
    });
    const other = mockFormEntry({ createBundleEntries: jest.fn(() => []) });

    const submission = submitConsultation({
      activeEncounter: null,
      episodeOfCareUuids: [],
      activeEntries: [failing, other],
    });

    await expect(submission).rejects.toThrow();
    expect(other.createBundleEntries).not.toHaveBeenCalled();
    expect(mockPostEncounterBundle).not.toHaveBeenCalled();
  });

  it('does not prepare form entries that have no data', async () => {
    const entry = mockFormEntry({
      hasData: jest.fn().mockReturnValue(false),
      prepareBundleEntries: jest.fn(),
    });

    await submitConsultation({
      activeEncounter: null,
      episodeOfCareUuids: [],
      activeEntries: [entry],
    });

    expect(entry.prepareBundleEntries).not.toHaveBeenCalled();
  });
});

describe('submitConsultation with the real documents control', () => {
  const mockUploadDocument = jest.mocked(uploadDocument);
  const card = (id: string, fileName: string) => ({
    ...createBlankDocumentEntry(id),
    documentType: CONSENT_FORM_TYPE,
    files: [createPendingDocument(fileName)],
  });
  const documentsOnly = () =>
    getActiveEntries(
      getRegisteredInputControls(),
      'Patient Document',
      'documents',
    );

  beforeEach(() => {
    global.URL.revokeObjectURL = jest.fn();
    mockPostEncounterBundle.mockClear();
    mockCreateEncounterBundle.mockClear();
    mockUploadDocument.mockReset();
    useDocumentsStore.getState().reset();
    useDocumentsStore
      .getState()
      .setEntries([card('DOC1', 'a.png'), card('DOC2', 'b.png')]);
  });

  const submit = () =>
    submitConsultation({
      activeEncounter: null,
      episodeOfCareUuids: [],
      activeEntries: documentsOnly(),
    });

  it('saves nothing when one of two document cards fails to upload', async () => {
    mockUploadDocument.mockImplementation(async (file: File) => {
      if (file.name === 'b.png') throw new Error('Disk full');
      return { url: `100/${file.name}` };
    });

    await expect(submit()).rejects.toThrow();

    expect(mockCreateEncounterBundle).not.toHaveBeenCalled();
    expect(mockPostEncounterBundle).not.toHaveBeenCalled();
  });

  it('saves both cards on the retry, uploading only the file that failed before', async () => {
    mockUploadDocument.mockImplementation(async (file: File) => {
      if (file.name === 'b.png') throw new Error('Disk full');
      return { url: `100/${file.name}` };
    });
    await expect(submit()).rejects.toThrow();
    mockUploadDocument.mockReset();
    mockUploadDocument.mockResolvedValue({ url: '100/b.png' });

    await submit();

    expect(mockUploadDocument).toHaveBeenCalledTimes(1);
    expect(mockPostEncounterBundle).toHaveBeenCalledTimes(1);
    const [entries] = mockCreateEncounterBundle.mock.calls[0];
    expect(entries).toHaveLength(3);
  });
});
