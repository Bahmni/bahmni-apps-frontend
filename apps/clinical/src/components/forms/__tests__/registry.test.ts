import type { InputControl } from '../models';
import {
  clearRegistry,
  getRegisteredInputControls,
  registerInputControl,
} from '../registry';

const makeEntry = (key: string): InputControl => ({
  key,
  component: () => null,
  reset: jest.fn(),
  validate: jest.fn().mockReturnValue(true),
  hasData: jest.fn().mockReturnValue(false),
  subscribe: jest.fn().mockReturnValue(jest.fn()),
});

beforeEach(() => {
  clearRegistry();
});

describe('registerInputControl', () => {
  it('adds an entry to the registry', () => {
    registerInputControl(makeEntry('allergies'));
    expect(getRegisteredInputControls()).toHaveLength(1);
  });

  it('preserves registration order', () => {
    registerInputControl(makeEntry('allergies'));
    registerInputControl(makeEntry('medications'));
    registerInputControl(makeEntry('observations'));

    expect(getRegisteredInputControls().map((e) => e.key)).toEqual([
      'allergies',
      'medications',
      'observations',
    ]);
  });
});

describe('getRegisteredInputControls', () => {
  it('returns empty array when nothing is registered', () => {
    expect(getRegisteredInputControls()).toEqual([]);
  });

  it('returns the same reference as the live registry', () => {
    const before = getRegisteredInputControls();
    registerInputControl(makeEntry('allergies'));
    expect(before).toHaveLength(1);
  });
});
