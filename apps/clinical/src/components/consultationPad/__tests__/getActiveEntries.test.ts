import type { ConsultationEventAction } from '@bahmni/services';
import type { InputControl } from '../../forms';
import {
  clearRegistry,
  getRegisteredInputControls,
} from '../../forms/registry';
import { getActiveEntries, getPadTitleKey } from '../utils';

import '../../forms/allergies';
import '../../forms/conditionsAndDiagnoses';
import '../../forms/encounterDetails';
import '../../forms/immunization';
import '../../forms/investigations';
import '../../forms/medicationRequest';
import '../../forms/observations';
import '../../forms/stopMedications';

jest.mock('../../forms/allergies/AllergiesForm', () => 'AllergiesForm');
jest.mock(
  '../../forms/conditionsAndDiagnoses/ConditionsAndDiagnoses',
  () => 'ConditionsAndDiagnoses',
);
jest.mock(
  '../../forms/encounterDetails/EncounterDetails',
  () => 'EncounterDetails',
);
jest.mock(
  '../../forms/immunization/ImmunizationForm',
  () => 'ImmunizationForm',
);
jest.mock(
  '../../forms/investigations/InvestigationsForm',
  () => 'InvestigationsForm',
);
jest.mock(
  '../../forms/medicationRequest/MedicationRequestForm',
  () => 'MedicationRequestForm',
);
jest.mock(
  '../../forms/observations/ObservationFormsPanel',
  () => 'ObservationFormsPanel',
);
jest.mock(
  '../../forms/stopMedications/StopMedicationForm',
  () => 'StopMedicationForm',
);

// Mirrors the deployed consultationPad config: every control is limited to
// the encounter type it is configured for, as in standard-config app.json.
const DEPLOYED_ENCOUNTER_TYPES: Record<string, string[] | undefined> = {
  encounterDetails: undefined,
  allergies: ['Consultation'],
  conditionsAndDiagnoses: ['Consultation'],
  investigations: ['Consultation'],
  medication: ['Consultation'],
  vaccination: ['Consultation'],
  stopMedications: ['Consultation'],
  observationForms: ['Consultation'],
  immunizationHistory: ['Immunization'],
  immunizationAdministration: ['Immunization Administration'],
  immunizationWaiver: ['Immunization'],
  cancelVaccination: ['Immunization Administration'],
};

const registry: InputControl[] = [];

beforeAll(() => {
  registry.push(
    ...getRegisteredInputControls().map((entry) => ({
      ...entry,
      encounterTypes: DEPLOYED_ENCOUNTER_TYPES[entry.key],
    })),
  );
});

afterAll(() => clearRegistry());

const keysOf = (entries: InputControl[]) =>
  entries.map((entry) => entry.key).sort((a, b) => a.localeCompare(b));

const withEncounterDetails = (...keys: string[]) =>
  [...keys, 'encounterDetails'].sort((a, b) => a.localeCompare(b));

describe('getActiveEntries (real control registrations)', () => {
  describe('without an action', () => {
    it('shows every regular control and hides delete-only controls for a new consultation', () => {
      const result = keysOf(getActiveEntries(registry, {}, undefined));

      expect(result).toEqual(
        expect.arrayContaining([
          'allergies',
          'medication',
          'vaccination',
          'investigations',
          'conditionsAndDiagnoses',
          'observationForms',
          'encounterDetails',
        ]),
      );
      expect(result).not.toContain('stopMedications');
      expect(result).not.toContain('cancelVaccination');
    });

    it('starting an Immunization encounter shows only the immunization controls', () => {
      const result = keysOf(
        getActiveEntries(
          registry,
          { encounterType: 'Immunization' },
          undefined,
        ),
      );

      expect(result).toEqual(
        withEncounterDetails('immunizationHistory', 'immunizationWaiver'),
      );
    });

    it('shows all registered regular controls when no encounter type is given', () => {
      const result = keysOf(getActiveEntries(registry, undefined, undefined));

      expect(result).toEqual(
        expect.arrayContaining([
          'allergies',
          'immunizationHistory',
          'immunizationAdministration',
          'immunizationWaiver',
        ]),
      );
    });
  });

  describe.each<[string, ConsultationEventAction, string[]]>([
    [
      'Add allergy opens only the allergy control',
      { type: 'create', resourceType: 'AllergyIntolerance' },
      withEncounterDetails('allergies'),
    ],
    [
      'Edit allergy opens only the allergy control',
      {
        type: 'update',
        resources: [{ resourceType: 'AllergyIntolerance', id: 'a-1' }],
      },
      withEncounterDetails('allergies'),
    ],
    [
      'Add medication opens only the medication control',
      { type: 'create', resourceType: 'MedicationRequest' },
      withEncounterDetails('medication'),
    ],
    [
      'Edit medication opens only the medication control',
      {
        type: 'update',
        resources: [{ resourceType: 'MedicationRequest', id: 'm-1' }],
      },
      withEncounterDetails('medication'),
    ],
    [
      'Order investigation opens only the investigations control',
      { type: 'create', resourceType: 'ServiceRequest' },
      withEncounterDetails('investigations'),
    ],
    [
      'Edit observation opens only the observation forms control',
      {
        type: 'update',
        resources: [{ resourceType: 'Observation', id: 'o-1' }],
      },
      withEncounterDetails('observationForms'),
    ],
    [
      'Open a task form opens only the observation forms control',
      { type: 'create', resourceType: 'Observation' },
      withEncounterDetails('observationForms'),
    ],
  ])('%s', (_, action, expected) => {
    it('routes to the single targeted control', () => {
      expect(keysOf(getActiveEntries(registry, {}, action))).toEqual(expected);
    });
  });

  describe('cancel vaccination vs stop medication', () => {
    const deleteMedication: ConsultationEventAction = {
      type: 'delete',
      resources: [{ resourceType: 'MedicationRequest', id: 'm-1' }],
    };

    it('narrows to the delete controls only; the encounter type picks between them', () => {
      expect(keysOf(getActiveEntries(registry, {}, deleteMedication))).toEqual(
        withEncounterDetails('cancelVaccination', 'stopMedications'),
      );
    });

    it('routes a delete from the Consultation encounter type to stop only', () => {
      expect(
        keysOf(
          getActiveEntries(
            registry,
            { encounterType: 'Consultation' },
            deleteMedication,
          ),
        ),
      ).toEqual(withEncounterDetails('stopMedications'));
    });

    it('routes a delete from the Immunization Administration encounter type to cancel only', () => {
      expect(
        keysOf(
          getActiveEntries(
            registry,
            { encounterType: 'Immunization Administration' },
            deleteMedication,
          ),
        ),
      ).toEqual(withEncounterDetails('cancelVaccination'));
    });
  });

  describe('immunization', () => {
    it('Administer opens only the administration control', () => {
      const result = keysOf(
        getActiveEntries(
          registry,
          { encounterType: 'Immunization Administration' },
          { type: 'create', resourceType: 'Immunization' },
        ),
      );

      expect(result).toEqual(
        withEncounterDetails('immunizationAdministration'),
      );
    });

    it('adding from the Administered tab opens the history control, not the waiver', () => {
      const result = keysOf(
        getActiveEntries(
          registry,
          { encounterType: 'Immunization' },
          {
            type: 'create',
            resourceType: 'Immunization',
            resources: [{ resourceType: 'Immunization', status: 'completed' }],
          },
        ),
      );

      expect(result).toEqual(withEncounterDetails('immunizationHistory'));
    });

    it('adding from the Not Administered tab opens the waiver control, not the history', () => {
      const result = keysOf(
        getActiveEntries(
          registry,
          { encounterType: 'Immunization' },
          {
            type: 'create',
            resourceType: 'Immunization',
            resources: [{ resourceType: 'Immunization', status: 'not-done' }],
          },
        ),
      );

      expect(result).toEqual(withEncounterDetails('immunizationWaiver'));
    });
  });

  it('always keeps the encounter details control for any action', () => {
    const result = getActiveEntries(
      registry,
      {},
      {
        type: 'create',
        resourceType: 'AllergyIntolerance',
      },
    );

    expect(result.some((entry) => entry.key === 'encounterDetails')).toBe(true);
  });

  it('does not infer the encounter type from the encounter display text', () => {
    const result = keysOf(
      getActiveEntries(
        registry,
        {
          encounter: {
            resourceType: 'Encounter',
            id: 'enc-1',
            type: [{ coding: [{ display: 'Immunization' }] }],
          },
        },
        undefined,
      ),
    );

    expect(result).toContain('allergies');
    expect(result).toContain('immunizationHistory');
  });
});

describe('getPadTitleKey', () => {
  const active = (...keys: string[]) =>
    registry.filter((entry) => keys.includes(entry.key));

  it.each<[string, ConsultationEventAction | undefined, string]>([
    [
      'edit allergy',
      { type: 'update', resources: [{ resourceType: 'AllergyIntolerance' }] },
      'EDIT_ALLERGIES_TITLE',
    ],
    [
      'edit medication',
      { type: 'update', resources: [{ resourceType: 'MedicationRequest' }] },
      'MEDICATIONS_EDIT_FORM_TITLE',
    ],
    [
      'edit observation',
      { type: 'update', resources: [{ resourceType: 'Observation' }] },
      'EDIT_OBSERVATION_FORM_TITLE',
    ],
    [
      'stop medication',
      { type: 'delete', resources: [{ resourceType: 'MedicationRequest' }] },
      'STOP_MEDICATION_FORM_TITLE',
    ],
    [
      'add immunization',
      { type: 'create', resourceType: 'Immunization' },
      'CONSULTATION_ACTION_NEW',
    ],
    ['no action', undefined, 'CONSULTATION_ACTION_NEW'],
  ])('uses the matching title for %s', (_, action, expected) => {
    expect(getPadTitleKey({}, action, active('encounterDetails'))).toBe(
      expected,
    );
  });

  it('uses the cancel vaccination title when the cancel control is active', () => {
    expect(
      getPadTitleKey(
        {},
        { type: 'delete', resources: [{ resourceType: 'MedicationRequest' }] },
        active('cancelVaccination', 'encounterDetails'),
      ),
    ).toBe('CANCEL_VACCINATION_FORM_TITLE');
  });

  it('reads "Continue" only for a plain continue (encounter, no action)', () => {
    expect(
      getPadTitleKey(
        { encounter: { resourceType: 'Encounter', id: 'enc-1' } },
        undefined,
        [],
      ),
    ).toBe('CONSULTATION_ACTION_CONTINUE');
  });
});
