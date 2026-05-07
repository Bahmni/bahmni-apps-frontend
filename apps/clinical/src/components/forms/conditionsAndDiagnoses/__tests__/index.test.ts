import {
  createConditionsBundleEntries,
  createDiagnosisBundleEntries,
} from '../../../../services/consultationBundleService';
import { useConditionsAndDiagnosesStore } from '../../../../stores';
import { clearRegistry, getRegisteredInputControls } from '../../registry';
import ConditionsAndDiagnoses from '../ConditionsAndDiagnoses';

import '../index';

jest.mock('../../../../stores', () => ({
  useConditionsAndDiagnosesStore: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../../../../services/consultationBundleService', () => ({
  createDiagnosisBundleEntries: jest.fn().mockReturnValue([{ id: 'diag' }]),
  createConditionsBundleEntries: jest.fn().mockReturnValue([{ id: 'cond' }]),
}));

jest.mock('../ConditionsAndDiagnoses', () => 'ConditionsAndDiagnoses');

afterAll(() => clearRegistry());

const mockGetState = useConditionsAndDiagnosesStore.getState as jest.Mock;
const mockSubscribe = useConditionsAndDiagnosesStore.subscribe as jest.Mock;
const mockCreateDiagnosisEntries = createDiagnosisBundleEntries as jest.Mock;
const mockCreateConditionsEntries = createConditionsBundleEntries as jest.Mock;

describe('conditionsAndDiagnoses index registration', () => {
  let mockReset: jest.Mock;
  let mockValidate: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    mockValidate = jest.fn().mockReturnValue(true);
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      reset: mockReset,
      validate: mockValidate,
      selectedDiagnoses: [],
      selectedConditions: [],
    });
  });

  const getEntry = () =>
    getRegisteredInputControls().find(
      (e) => e.key === 'conditionsAndDiagnoses',
    )!;

  it('registers with key "conditionsAndDiagnoses" and correct component', () => {
    const entry = getEntry();
    expect(entry).toBeDefined();
    expect(entry.component).toBe(ConditionsAndDiagnoses);
  });

  it('delegates reset and validate to store', () => {
    getEntry().reset();
    expect(mockReset).toHaveBeenCalledTimes(1);
    getEntry().validate();
    expect(mockValidate).toHaveBeenCalledTimes(1);
  });

  it.each([
    { diagnoses: [], conditions: [], expected: false },
    { diagnoses: [{}], conditions: [], expected: true },
    { diagnoses: [], conditions: [{}], expected: true },
  ])(
    'hasData() returns $expected when diagnoses=$diagnoses, conditions=$conditions',
    ({ diagnoses, conditions, expected }) => {
      mockGetState.mockReturnValue({
        selectedDiagnoses: diagnoses,
        selectedConditions: conditions,
      });
      expect(getEntry().hasData()).toBe(expected);
    },
  );

  it('subscribe() delegates to store', () => {
    const cb = jest.fn();
    getEntry().subscribe(cb);
    expect(mockSubscribe).toHaveBeenCalledWith(cb);
  });

  it('createBundleEntries() spreads both diagnosis and conditions entries', () => {
    const selectedDiagnoses = [{ id: 'diag-1' }];
    const selectedConditions = [{ id: 'cond-1' }];
    mockGetState.mockReturnValue({ selectedDiagnoses, selectedConditions });
    const ctx = {
      encounterSubject: { reference: 'Patient/1' },
      encounterReference: 'enc-1',
      practitionerUUID: 'prac-1',
      consultationDate: new Date(),
    };
    const result = getEntry().createBundleEntries!(ctx as any);
    expect(mockCreateDiagnosisEntries).toHaveBeenCalledWith({
      selectedDiagnoses,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
      consultationDate: ctx.consultationDate,
    });
    expect(mockCreateConditionsEntries).toHaveBeenCalledWith({
      selectedConditions,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
      consultationDate: ctx.consultationDate,
    });
    expect(result).toEqual([{ id: 'diag' }, { id: 'cond' }]);
  });
});
