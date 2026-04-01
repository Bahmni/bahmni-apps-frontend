import React from 'react';
import { AdditionalIdentifiers } from '../../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import { AdditionalInfo } from '../../../components/forms/additionalInfo/AdditionalInfo';
import { AddressInfo } from '../../../components/forms/addressInfo/AddressInfo';
import { ContactInfo } from '../../../components/forms/contactInfo/ContactInfo';
import { PatientRelationships } from '../../../components/forms/patientRelationships/PatientRelationships';
import { builtInFormSections } from '../formSectionMap';
import { FormControlRefs, FormControlData, FormControlGuards } from '../models';

describe('formSectionMap', () => {
  describe('builtInFormSections array', () => {
    it('should have all 5 control types', () => {
      const types = builtInFormSections.map((section) => section.type);
      expect(types).toEqual([
        'address',
        'contactInfo',
        'additionalInfo',
        'additionalIdentifiers',
        'relationships',
      ]);
    });

    it('should map address type correctly', () => {
      const address = builtInFormSections.find((s) => s.type === 'address');
      expect(address?.component).toBe(AddressInfo);
    });

    it('should map contactInfo type correctly', () => {
      const contactInfo = builtInFormSections.find(
        (s) => s.type === 'contactInfo',
      );
      expect(contactInfo?.component).toBe(ContactInfo);
    });

    it('should map additionalInfo type correctly', () => {
      const additionalInfo = builtInFormSections.find(
        (s) => s.type === 'additionalInfo',
      );
      expect(additionalInfo?.component).toBe(AdditionalInfo);
    });

    it('should map additionalIdentifiers type correctly', () => {
      const additionalIdentifiers = builtInFormSections.find(
        (s) => s.type === 'additionalIdentifiers',
      );
      expect(additionalIdentifiers?.component).toBe(AdditionalIdentifiers);
    });

    it('should map relationships type correctly', () => {
      const relationships = builtInFormSections.find(
        (s) => s.type === 'relationships',
      );
      expect(relationships?.component).toBe(PatientRelationships);
    });
  });

  describe('render functions', () => {
    const mockRefs: FormControlRefs = {
      profileRef: React.createRef(),
      addressRef: React.createRef(),
      contactRef: React.createRef(),
      additionalRef: React.createRef(),
      identifiersRef: React.createRef(),
      relationshipsRef: React.createRef(),
    };

    const mockData: FormControlData = {
      profileInitialData: undefined,
      addressInitialData: undefined,
      personAttributesInitialData: undefined,
      additionalIdentifiersInitialData: undefined,
      relationshipsInitialData: undefined,
      initialDobEstimated: false,
      patientPhoto: undefined,
    };

    const mockComponent = () =>
      React.createElement('div', {}, 'Test Component');

    it('additionalIdentifiers render returns null when shouldShowAdditionalIdentifiers is false', () => {
      const additionalIdentifiers = builtInFormSections.find(
        (s) => s.type === 'additionalIdentifiers',
      );

      const guards: FormControlGuards = {
        shouldShowAdditionalIdentifiers: false,
        relationshipTypes: [],
      };

      const result = additionalIdentifiers?.render(
        mockComponent,
        mockRefs,
        mockData,
        guards,
      );

      expect(result).toBeNull();
    });

    it('additionalIdentifiers render returns component when shouldShowAdditionalIdentifiers is true', () => {
      const additionalIdentifiers = builtInFormSections.find(
        (s) => s.type === 'additionalIdentifiers',
      );

      const guards: FormControlGuards = {
        shouldShowAdditionalIdentifiers: true,
        relationshipTypes: [],
      };

      const result = additionalIdentifiers?.render(
        mockComponent,
        mockRefs,
        mockData,
        guards,
      );

      expect(result).not.toBeNull();
      expect(React.isValidElement(result)).toBe(true);
    });

    it('relationships render returns null when relationshipTypes is empty array', () => {
      const relationships = builtInFormSections.find(
        (s) => s.type === 'relationships',
      );

      const guards: FormControlGuards = {
        shouldShowAdditionalIdentifiers: true,
        relationshipTypes: [],
      };

      const result = relationships?.render(
        mockComponent,
        mockRefs,
        mockData,
        guards,
      );

      expect(result).toBeNull();
    });

    it('relationships render returns null when relationshipTypes is not an array', () => {
      const relationships = builtInFormSections.find(
        (s) => s.type === 'relationships',
      );

      const guards: FormControlGuards = {
        shouldShowAdditionalIdentifiers: true,
        relationshipTypes: undefined as any,
      };

      const result = relationships?.render(
        mockComponent,
        mockRefs,
        mockData,
        guards,
      );

      expect(result).toBeNull();
    });

    it('relationships render returns component when relationshipTypes has items', () => {
      const relationships = builtInFormSections.find(
        (s) => s.type === 'relationships',
      );

      const guards: FormControlGuards = {
        shouldShowAdditionalIdentifiers: true,
        relationshipTypes: [
          { uuid: '1', displayString: 'Parent' },
          { uuid: '2', displayString: 'Child' },
        ],
      };

      const result = relationships?.render(
        mockComponent,
        mockRefs,
        mockData,
        guards,
      );

      expect(result).not.toBeNull();
      expect(React.isValidElement(result)).toBe(true);
    });
  });
});
