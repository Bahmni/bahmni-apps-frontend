import Ajv from 'ajv';
import schema from '../schema.json';

const baseContext = {
  context: 'patient',
  translationKey: 'PATIENT_SEARCH',
  requiredPrivileges: ['View Patients'],
  locationAware: 'loggedInLocation',
  url: '/openmrs/ws/rest/v1/patient/search',
  pageSize: 20,
  criteria: [
    {
      field: { key: 'patient.name.given' },
      translationKey: 'PATIENT_GIVEN_NAME',
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
      },
    },
  ],
};

const validate = new Ajv().compile(schema);

const configWithResultFields = (resultFields: unknown[]) => [
  { ...baseContext, resultFields },
];

describe('commonSearchConfig schema — sort config validation', () => {
  it('rejects a resultField with sortOrder but no sortPriority', () => {
    const isValid = validate(
      configWithResultFields([
        { translationKey: 'NAME', expression: 'name', sortOrder: 'asc' },
      ]),
    );
    expect(isValid).toBe(false);
  });

  it('accepts a resultField with both sortOrder and sortPriority', () => {
    const isValid = validate(
      configWithResultFields([
        {
          translationKey: 'NAME',
          expression: 'name',
          sortOrder: 'asc',
          sortPriority: 1,
        },
      ]),
    );
    expect(isValid).toBe(true);
  });

  it('accepts a resultField with only sortPriority (sortOrder is optional)', () => {
    const isValid = validate(
      configWithResultFields([
        { translationKey: 'NAME', expression: 'name', sortPriority: 1 },
      ]),
    );
    expect(isValid).toBe(true);
  });

  it('rejects an out-of-range or non-integer sortPriority', () => {
    expect(
      validate(
        configWithResultFields([
          { translationKey: 'NAME', expression: 'name', sortPriority: 0 },
        ]),
      ),
    ).toBe(false);
    expect(
      validate(
        configWithResultFields([
          { translationKey: 'NAME', expression: 'name', sortPriority: 1.5 },
        ]),
      ),
    ).toBe(false);
  });
});
