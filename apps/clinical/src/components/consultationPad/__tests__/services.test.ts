import * as consultationBundleService from '../../../services/consultationBundleService';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import * as conceptExtractor from '../../../utils/fhir/conceptExtractor';
import * as consultationBundleCreator from '../../../utils/fhir/consultationBundleCreator';
import * as encounterResourceCreator from '../../../utils/fhir/encounterResourceCreator';
import { submitConsultation } from '../services';
import {
  mockBundle,
  mockEncounterBundleEntry,
  mockEncounterResource,
  mockFormEntry,
  mockResponseBundle,
  mockStoreState,
  mockUpdatedConcepts,
} from './__mocks__/servicesMocks';

jest.mock('../../../stores/encounterDetailsStore');
jest.mock('../../../services/consultationBundleService');
jest.mock('../../../utils/fhir/encounterResourceCreator');
jest.mock('../../../utils/fhir/consultationBundleCreator');
jest.mock('../../../utils/fhir/conceptExtractor');

const mockCreateEncounterResource = jest.mocked(
  encounterResourceCreator.createEncounterResource,
);
const mockCreateEncounterBundleEntry = jest.mocked(
  consultationBundleService.createEncounterBundleEntry,
);
const mockGetEncounterReference = jest.mocked(
  consultationBundleService.getEncounterReference,
);
const mockCreateConsultationBundle = jest.mocked(
  consultationBundleCreator.createConsultationBundle,
);
const mockPostConsultationBundle = jest.mocked(
  consultationBundleService.postConsultationBundle,
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
  mockCreateConsultationBundle.mockReturnValue(mockBundle);
  mockPostConsultationBundle.mockResolvedValue(mockResponseBundle);
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

    expect(mockPostConsultationBundle).toHaveBeenCalledWith(mockBundle);
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
    expect(mockCreateConsultationBundle).toHaveBeenCalledWith([
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
});
