import React from 'react';
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

    it('additionalIdentifiers render returns null when shouldShowAdditionalIdentifiers is false', () => {
      const additionalIdentifiers = builtInFormSections.find(
        (s) => s.type === 'additionalIdentifiers',
      );

      const guards: FormControlGuards = {
        shouldShowAdditionalIdentifiers: false,
        relationshipTypes: [],
      };

      const result = additionalIdentifiers?.render(mockRefs, mockData, guards);

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

      const result = additionalIdentifiers?.render(mockRefs, mockData, guards);

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

      const result = relationships?.render(mockRefs, mockData, guards);

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

      const result = relationships?.render(mockRefs, mockData, guards);

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

      const result = relationships?.render(mockRefs, mockData, guards);

      expect(result).not.toBeNull();
      expect(React.isValidElement(result)).toBe(true);
    });
  });
});
