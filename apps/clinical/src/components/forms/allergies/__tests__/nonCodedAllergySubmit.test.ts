import {
  OTHER_NON_CODED_ALLERGEN_UUID,
  saveAllergy,
  fetchAllergySeverityConceptUUIDs,
  fetchOtherNonCodedAllergenUUID,
} from '@bahmni/services';
import type { AllergyInputEntry } from '../../../../models/allergy';
import { useAllergyStore, useEncounterDetailsStore } from '../../../../stores';
import type { InputControl } from '../../models';
import { getRegisteredInputControls } from '../../registry';
// Side-effect import: registers the allergies control in the shared registry.
import '../index';

const MILD_CONCEPT = '1498AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const MODERATE_CONCEPT = '1499AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const SEVERE_CONCEPT = '1500AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  saveAllergy: jest.fn(),
  fetchAllergySeverityConceptUUIDs: jest.fn().mockResolvedValue({
    mild: '1498AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    moderate: '1499AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    severe: '1500AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  }),
  // Avoids a real network call from hasBundleData's await; the uuid value
  // itself doesn't matter here since these tests exercise the REST path.
  fetchOtherNonCodedAllergenUUID: jest
    .fn()
    .mockResolvedValue('5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
}));

jest.mock('../AllergiesForm', () => ({
  __esModule: true,
  default: () => null,
}));

const makeAllergy = (
  overrides: Partial<AllergyInputEntry> = {},
): AllergyInputEntry => ({
  id: 'concept-uuid',
  entryId: 'entry-uuid',
  display: 'Penicillin',
  type: 'medication',
  selectedSeverity: { code: 'mild', display: 'Mild' },
  selectedReactions: [{ code: 'reaction-uuid', display: 'Rash' }],
  errors: {},
  hasBeenValidated: true,
  ...overrides,
});

/** The "Other, Non-Coded" allergen, as picked from the Drug allergen set. */
const makeNonCodedAllergy = (
  overrides: Partial<AllergyInputEntry> = {},
): AllergyInputEntry =>
  makeAllergy({
    id: OTHER_NON_CODED_ALLERGEN_UUID,
    display: 'Other non-coded',
    type: 'medication',
    nonCodedAllergen: 'Ibuprofen gel',
    ...overrides,
  });

const allergiesControl = (): InputControl => {
  const control = getRegisteredInputControls().find(
    (entry) => entry.key === 'allergies',
  );
  if (!control) throw new Error('allergies control was not registered');
  return control;
};

describe('allergies control - REST save path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAllergyStore.getState().reset();
    useEncounterDetailsStore.setState({ patientUUID: 'patient-123' });
  });

  describe('Other, Non-Coded allergen', () => {
    it('sends the free text as nonCodedAllergen and keeps the picked category', async () => {
      useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

      await allergiesControl().onDirectSubmit!();

      expect(saveAllergy).toHaveBeenCalledWith(
        'patient-123',
        {
          allergen: {
            // the concept was picked from the Drug set, so it stays DRUG
            allergenType: 'DRUG',
            codedAllergen: { uuid: OTHER_NON_CODED_ALLERGEN_UUID },
            nonCodedAllergen: 'Ibuprofen gel',
          },
          reactions: [{ reaction: { uuid: 'reaction-uuid' } }],
          severity: { uuid: MILD_CONCEPT },
        },
        undefined,
      );
    });

    it('trims the free-text allergen name', async () => {
      useAllergyStore.setState({
        selectedAllergies: [
          makeNonCodedAllergy({ nonCodedAllergen: '  Shellfish stock  ' }),
        ],
      });

      await allergiesControl().onDirectSubmit!();

      expect(saveAllergy).toHaveBeenCalledWith(
        'patient-123',
        expect.objectContaining({
          allergen: expect.objectContaining({
            nonCodedAllergen: 'Shellfish stock',
          }),
        }),
        undefined,
      );
    });

    it('carries the category through for a food non-coded allergen', async () => {
      useAllergyStore.setState({
        selectedAllergies: [makeNonCodedAllergy({ type: 'food' })],
      });

      await allergiesControl().onDirectSubmit!();

      expect(saveAllergy).toHaveBeenCalledWith(
        'patient-123',
        expect.objectContaining({
          allergen: expect.objectContaining({ allergenType: 'FOOD' }),
        }),
        undefined,
      );
    });
  });

  describe('severity', () => {
    it('sends the OpenMRS severity concept uuid, not the FHIR code', async () => {
      useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

      await allergiesControl().onDirectSubmit!();

      const payload = (saveAllergy as jest.Mock).mock.calls[0][1];
      expect(payload.severity).toEqual({ uuid: MILD_CONCEPT });
      expect(payload.severity.uuid).not.toBe('mild');
    });

    it('maps each severity to its own concept', async () => {
      useAllergyStore.setState({
        selectedAllergies: [
          makeNonCodedAllergy({
            selectedSeverity: { code: 'severe', display: 'Severe' },
          }),
        ],
      });

      await allergiesControl().onDirectSubmit!();

      expect((saveAllergy as jest.Mock).mock.calls[0][1].severity).toEqual({
        uuid: SEVERE_CONCEPT,
      });
    });

    it('resolves the severity concept uuid from the backend rather than a hardcoded value', async () => {
      useAllergyStore.setState({
        selectedAllergies: [
          makeNonCodedAllergy({
            selectedSeverity: { code: 'moderate', display: 'Moderate' },
          }),
        ],
      });

      await allergiesControl().onDirectSubmit!();

      expect(fetchAllergySeverityConceptUUIDs).toHaveBeenCalled();
      expect((saveAllergy as jest.Mock).mock.calls[0][1].severity).toEqual({
        uuid: MODERATE_CONCEPT,
      });
    });

    it('propagates the error when a severity global property is missing on the backend', async () => {
      (fetchAllergySeverityConceptUUIDs as jest.Mock).mockRejectedValueOnce(
        new Error('ALLERGY_SEVERITY_CONCEPT_MISSING'),
      );
      useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

      await expect(allergiesControl().onDirectSubmit!()).rejects.toThrow(
        'ALLERGY_SEVERITY_CONCEPT_MISSING',
      );
      expect(saveAllergy).not.toHaveBeenCalled();
    });
  });

  it('leaves plain coded allergies to the encounter bundle', async () => {
    useAllergyStore.setState({ selectedAllergies: [makeAllergy()] });

    await allergiesControl().onDirectSubmit!();

    expect(saveAllergy).not.toHaveBeenCalled();
  });

  it('skips allergies that were pre-loaded and left untouched', async () => {
    useAllergyStore.setState({
      selectedAllergies: [makeNonCodedAllergy({ isModified: false })],
    });

    await allergiesControl().onDirectSubmit!();

    expect(saveAllergy).not.toHaveBeenCalled();
  });

  it('updates in place instead of duplicating when editing', async () => {
    useAllergyStore.setState({
      selectedAllergies: [
        makeNonCodedAllergy({
          resourceId: 'existing-allergy-uuid',
          isModified: true,
        }),
      ],
    });

    await allergiesControl().onDirectSubmit!();

    expect(saveAllergy).toHaveBeenCalledWith(
      'patient-123',
      expect.anything(),
      'existing-allergy-uuid',
    );
  });

  describe('resourceId capture (partial-save / retry duplicate prevention)', () => {
    it('records the backend uuid on the store entry after creating a new Other allergy', async () => {
      (saveAllergy as jest.Mock).mockResolvedValue({ uuid: 'created-uuid' });
      useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

      await allergiesControl().onDirectSubmit!();

      expect(useAllergyStore.getState().selectedAllergies[0].resourceId).toBe(
        'created-uuid',
      );
    });

    it('retrying after a bundle failure updates the existing record instead of creating a duplicate', async () => {
      useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

      // Attempt 1: the REST save succeeds (allergy is new, no resourceId yet)
      // but simulates the encounter bundle that follows failing, so nothing
      // is reset and the user retries the whole submit.
      (saveAllergy as jest.Mock).mockResolvedValueOnce({
        uuid: 'created-uuid',
      });
      await allergiesControl().onDirectSubmit!();

      expect(saveAllergy).toHaveBeenNthCalledWith(
        1,
        'patient-123',
        expect.anything(),
        undefined, // create — no resourceId existed yet
      );
      expect(useAllergyStore.getState().selectedAllergies[0].resourceId).toBe(
        'created-uuid',
      );

      // Attempt 2 (the retry): must now address the same record by uuid.
      (saveAllergy as jest.Mock).mockResolvedValueOnce({
        uuid: 'created-uuid',
      });
      await allergiesControl().onDirectSubmit!();

      expect(saveAllergy).toHaveBeenCalledTimes(2);
      expect(saveAllergy).toHaveBeenNthCalledWith(
        2,
        'patient-123',
        expect.anything(),
        'created-uuid', // update — no duplicate created
      );
    });

    it('does not disturb an already-known resourceId when saving again', async () => {
      (saveAllergy as jest.Mock).mockResolvedValue({
        uuid: 'existing-allergy-uuid',
      });
      useAllergyStore.setState({
        selectedAllergies: [
          makeNonCodedAllergy({ resourceId: 'existing-allergy-uuid' }),
        ],
      });

      await allergiesControl().onDirectSubmit!();

      expect(saveAllergy).toHaveBeenCalledWith(
        'patient-123',
        expect.anything(),
        'existing-allergy-uuid',
      );
      expect(useAllergyStore.getState().selectedAllergies[0].resourceId).toBe(
        'existing-allergy-uuid',
      );
    });

    it('a failure partway through a multi-entry save preserves already-captured resourceIds and never attempts entries after the failing one', async () => {
      const entry1 = makeNonCodedAllergy({
        entryId: 'entry-1',
        nonCodedAllergen: 'Ibuprofen gel',
      });
      const entry2 = makeNonCodedAllergy({
        entryId: 'entry-2',
        nonCodedAllergen: 'Shellfish stock',
      });
      const entry3 = makeNonCodedAllergy({
        entryId: 'entry-3',
        nonCodedAllergen: 'Latex',
      });
      useAllergyStore.setState({ selectedAllergies: [entry1, entry2, entry3] });

      (saveAllergy as jest.Mock)
        .mockResolvedValueOnce({ uuid: 'entry-1-uuid' }) // entry1 succeeds
        .mockRejectedValueOnce(new Error('500')); // entry2 fails

      await expect(allergiesControl().onDirectSubmit!()).rejects.toThrow('500');

      // entry1's resourceId survived the later failure; entry2 got none;
      // entry3 was never attempted (the loop stops at the rejection).
      const stateAfterFailure = useAllergyStore.getState().selectedAllergies;
      expect(stateAfterFailure[0].resourceId).toBe('entry-1-uuid');
      expect(stateAfterFailure[1].resourceId).toBeUndefined();
      expect(stateAfterFailure[2].resourceId).toBeUndefined();
      expect(saveAllergy).toHaveBeenCalledTimes(2);

      // Retry: entry1 must be addressed by uuid (update, no duplicate);
      // entry2 and entry3 are attempted fresh.
      (saveAllergy as jest.Mock)
        .mockResolvedValueOnce({ uuid: 'entry-1-uuid' })
        .mockResolvedValueOnce({ uuid: 'entry-2-uuid' })
        .mockResolvedValueOnce({ uuid: 'entry-3-uuid' });

      await allergiesControl().onDirectSubmit!();

      expect(saveAllergy).toHaveBeenCalledTimes(5);
      expect(saveAllergy).toHaveBeenNthCalledWith(
        3,
        'patient-123',
        expect.anything(),
        'entry-1-uuid', // update — no duplicate created
      );
      expect(saveAllergy).toHaveBeenNthCalledWith(
        4,
        'patient-123',
        expect.anything(),
        undefined, // create
      );
      expect(saveAllergy).toHaveBeenNthCalledWith(
        5,
        'patient-123',
        expect.anything(),
        undefined, // create
      );
      const stateAfterRetry = useAllergyStore.getState().selectedAllergies;
      expect(stateAfterRetry[1].resourceId).toBe('entry-2-uuid');
      expect(stateAfterRetry[2].resourceId).toBe('entry-3-uuid');
    });

    it('does not set a resourceId when the backend response has no uuid', async () => {
      (saveAllergy as jest.Mock).mockResolvedValue({});
      useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

      await allergiesControl().onDirectSubmit!();

      expect(
        useAllergyStore.getState().selectedAllergies[0].resourceId,
      ).toBeUndefined();
    });
  });

  it('does nothing when there is no patient in context', async () => {
    useEncounterDetailsStore.setState({ patientUUID: null });
    useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

    await allergiesControl().onDirectSubmit!();

    expect(saveAllergy).not.toHaveBeenCalled();
  });

  it('propagates a save failure so the consultation pad can report it', async () => {
    (saveAllergy as jest.Mock).mockRejectedValue(new Error('500'));
    useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

    await expect(allergiesControl().onDirectSubmit!()).rejects.toThrow('500');
  });

  // Regression: silently falling back to the hardcoded default uuid here
  // would risk routing a custom-UUID install's non-coded allergy through the
  // coded bundle path instead of this REST path — which can't carry its
  // free-text name. The lookup failure must propagate, not be swallowed.
  it('propagates an otherNonCoded uuid lookup failure instead of falling back to the default', async () => {
    (fetchOtherNonCodedAllergenUUID as jest.Mock).mockRejectedValueOnce(
      new Error('GLOBAL_PROPERTY_FETCH_FAILED'),
    );
    useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

    await expect(allergiesControl().onDirectSubmit!()).rejects.toThrow(
      'GLOBAL_PROPERTY_FETCH_FAILED',
    );
    expect(saveAllergy).not.toHaveBeenCalled();
  });

  describe('hasBundleData', () => {
    it('is false when every allergy must go over REST', async () => {
      useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

      await expect(allergiesControl().hasBundleData!()).resolves.toBe(false);
    });

    it('propagates an otherNonCoded uuid lookup failure instead of falling back to the default', async () => {
      (fetchOtherNonCodedAllergenUUID as jest.Mock).mockRejectedValueOnce(
        new Error('GLOBAL_PROPERTY_FETCH_FAILED'),
      );
      useAllergyStore.setState({ selectedAllergies: [makeNonCodedAllergy()] });

      await expect(allergiesControl().hasBundleData!()).rejects.toThrow(
        'GLOBAL_PROPERTY_FETCH_FAILED',
      );
    });

    it('does not look up the otherNonCoded uuid when every pending allergy is already classified as coded', async () => {
      (fetchOtherNonCodedAllergenUUID as jest.Mock).mockClear();
      useAllergyStore.setState({
        selectedAllergies: [{ ...makeAllergy(), isNonCoded: false }],
      });

      await expect(allergiesControl().hasBundleData!()).resolves.toBe(true);
      await expect(
        allergiesControl().onDirectSubmit!(),
      ).resolves.toBeUndefined();
      expect(fetchOtherNonCodedAllergenUUID).not.toHaveBeenCalled();
      expect(saveAllergy).not.toHaveBeenCalled();
    });

    it('is true when at least one allergy can travel in the bundle', async () => {
      useAllergyStore.setState({
        selectedAllergies: [makeNonCodedAllergy(), makeAllergy()],
      });

      await expect(allergiesControl().hasBundleData!()).resolves.toBe(true);
    });
  });
});
