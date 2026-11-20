import type { Patient } from 'fhir/r4';
import {
  toDuplicatePatientView,
  withSavedIdentifiers,
} from '../duplicatePatientView';

const fullPatient = {
  resourceType: 'Patient',
  id: 'p-1',
  meta: { versionId: '3' },
  active: true,
  photo: [{ contentType: 'image/jpeg', data: 'base64' }],
  name: [{ given: ['Naman'], family: 'Shukla' }],
  identifier: [{ use: 'official', type: { text: 'Passport' }, value: '1' }],
  address: [{ city: 'Bangalore', line: ['Block 4'] }],
  gender: 'female',
  birthDate: '1991-04-24',
  _birthDate: { extension: [{ url: 'birthTime', valueDateTime: 'x' }] },
  telecom: [{ system: 'phone', value: '90709890218' }],
  extension: [{ url: 'attr', valueString: 'secret' }],
  contact: [{ name: { family: 'Relative' } }],
  deceasedBoolean: false,
} as Patient;

describe('toDuplicatePatientView', () => {
  it('keeps only the fields the duplicate page displays', () => {
    expect(toDuplicatePatientView(fullPatient)).toEqual({
      resourceType: 'Patient',
      id: 'p-1',
      photo: fullPatient.photo,
      name: fullPatient.name,
      identifier: fullPatient.identifier,
      address: fullPatient.address,
      gender: 'female',
      birthDate: '1991-04-24',
      telecom: fullPatient.telecom,
    });
  });

  describe('address lines from the OpenMRS address extension', () => {
    const ADDRESS_EXT = 'http://fhir.openmrs.org/ext/address';
    const addressWith = (
      fields: { url: string; valueString: string }[],
      line?: string[],
    ): Patient => ({
      resourceType: 'Patient',
      address: [
        {
          city: 'cbe',
          country: 'India',
          line,
          extension: [{ url: ADDRESS_EXT, extension: fields }],
        },
      ],
    });
    const fields = [
      { url: `${ADDRESS_EXT}#address1`, valueString: '23' },
      { url: `${ADDRESS_EXT}#address2`, valueString: 'Gandhi St' },
    ];

    it('exposes address1 and address2 as line and drops the extension', () => {
      const view = toDuplicatePatientView(addressWith(fields));

      expect(view.address).toEqual([
        { city: 'cbe', country: 'India', line: ['23', 'Gandhi St'] },
      ]);
      expect(view.address?.[0]).not.toHaveProperty('extension');
    });

    it('prefers an existing line over the extension values', () => {
      const view = toDuplicatePatientView(addressWith(fields, ['23']));

      expect(view.address?.[0].line).toEqual(['23']);
    });
  });

  describe('phone and email from extensions', () => {
    const PHONE_URL = 'http://fhir.bahmni.org/ext/patient/phonenumber';
    const EMAIL_URL = 'http://fhir.bahmni.org/ext/patient/email';
    const base: Patient = { resourceType: 'Patient', id: 'p-1' };

    it('exposes them as telecom entries and does not send the extensions', () => {
      const view = toDuplicatePatientView({
        ...base,
        extension: [
          { url: EMAIL_URL, valueString: 'abc@gmail.com' },
          { url: PHONE_URL, valueString: '23456789' },
          {
            url: 'http://fhir.bahmni.org/ext/patient-record/date-created',
            valueDateTime: '2026-11-12T13:46:00+00:00',
          },
        ],
      });

      expect(view.telecom).toEqual([
        { system: 'phone', value: '23456789' },
        { system: 'email', value: 'abc@gmail.com' },
      ]);
      expect(view).not.toHaveProperty('extension');
    });

    it('prefers an existing telecom entry and falls back only for the other system', () => {
      const view = toDuplicatePatientView({
        ...base,
        telecom: [{ system: 'phone', value: '111' }],
        extension: [
          { url: PHONE_URL, valueString: '222' },
          { url: EMAIL_URL, valueString: 'abc@gmail.com' },
        ],
      });

      expect(view.telecom).toEqual([
        { system: 'phone', value: '111' },
        { system: 'email', value: 'abc@gmail.com' },
      ]);
    });

    it('ignores blank values and unrelated attribute extensions', () => {
      const view = toDuplicatePatientView({
        ...base,
        extension: [
          { url: PHONE_URL },
          { url: EMAIL_URL, valueString: '  ' },
          {
            url: 'http://fhir.bahmni.org/ext/patient/altphonenumber',
            valueString: '999',
          },
        ],
      });

      expect(view.telecom).toBeUndefined();
    });
  });
});

describe('withSavedIdentifiers', () => {
  const saved = [
    { use: 'official' as const, value: 'AB0001' },
    { type: { text: 'Passport' }, value: 'P123' },
  ];
  const payload: Patient = {
    resourceType: 'Patient',
    identifier: [{ type: { text: 'Visa' }, value: 'V999' }],
  };

  it('lists the saved identifiers first, then the newly entered ones', () => {
    const result = withSavedIdentifiers(payload, saved);

    expect(result.identifier).toEqual([...saved, payload.identifier?.[0]]);
  });

  it('returns the payload unchanged when nothing is saved', () => {
    expect(withSavedIdentifiers(payload, undefined)).toBe(payload);
  });
});
