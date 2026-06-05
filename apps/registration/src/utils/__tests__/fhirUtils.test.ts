import { toSlugCase, mapGenderToFhir, mapGenderFromFhir } from '../fhirUtils';

describe('toSlugCase', () => {
  it('should lowercase camelCase', () => {
    expect(toSlugCase('phoneNumber')).toBe('phonenumber');
    expect(toSlugCase('altPhoneNumber')).toBe('altphonenumber');
  });

  it('should replace spaces with hyphens', () => {
    expect(toSlugCase('Phone Number')).toBe('phone-number');
  });

  it('should strip special characters', () => {
    expect(toSlugCase('email@address!')).toBe('emailaddress');
  });

  it('should collapse multiple hyphens', () => {
    expect(toSlugCase('a  -  b')).toBe('a-b');
  });
});

describe('mapGenderToFhir', () => {
  it('should map M/F/O to FHIR codes', () => {
    expect(mapGenderToFhir('Male')).toBe('male');
    expect(mapGenderToFhir('Female')).toBe('female');
    expect(mapGenderToFhir('Other')).toBe('other');
  });

  it('should return unknown for empty or unrecognized', () => {
    expect(mapGenderToFhir('')).toBe('unknown');
    expect(mapGenderToFhir('X')).toBe('unknown');
  });
});

describe('mapGenderFromFhir', () => {
  it('should reverse map FHIR codes to OpenMRS codes', () => {
    expect(mapGenderFromFhir('male')).toBe('M');
    expect(mapGenderFromFhir('female')).toBe('F');
    expect(mapGenderFromFhir('other')).toBe('O');
    expect(mapGenderFromFhir('unknown')).toBe('U');
  });
});
