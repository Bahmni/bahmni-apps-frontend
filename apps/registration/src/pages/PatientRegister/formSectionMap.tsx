import React from 'react';
import { AdditionalIdentifiers } from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import { AdditionalInfo } from '../../components/forms/additionalInfo/AdditionalInfo';
import { AddressInfo } from '../../components/forms/addressInfo/AddressInfo';
import { ContactInfo } from '../../components/forms/contactInfo/ContactInfo';
import { PatientRelationships } from '../../components/forms/patientRelationships/PatientRelationships';
import { FormSectionConfig } from './models';

export const builtInFormSections: FormSectionConfig[] = [
  {
    type: 'address',
    component: AddressInfo,
    render: (Component, refs, data) => (
      <Component ref={refs.addressRef} initialData={data.addressInitialData} />
    ),
  },
  {
    type: 'contactInfo',
    component: ContactInfo,
    render: (Component, refs, data) => (
      <Component
        ref={refs.contactRef}
        initialData={data.personAttributesInitialData}
      />
    ),
  },
  {
    type: 'additionalInfo',
    component: AdditionalInfo,
    render: (Component, refs, data) => (
      <Component
        ref={refs.additionalRef}
        initialData={data.personAttributesInitialData}
      />
    ),
  },
  {
    type: 'additionalIdentifiers',
    component: AdditionalIdentifiers,
    render: (Component, refs, data, guards) => {
      if (!guards.shouldShowAdditionalIdentifiers) return null;
      return (
        <Component
          ref={refs.additionalIdentifiersRef}
          initialData={data.additionalIdentifiersInitialData}
        />
      );
    },
  },
  {
    type: 'relationships',
    component: PatientRelationships,
    render: (Component, refs, data, guards) => {
      if (
        !Array.isArray(guards.relationshipTypes) ||
        guards.relationshipTypes.length === 0
      ) {
        return null;
      }
      return (
        <Component
          ref={refs.relationshipsRef}
          initialData={data.relationshipsInitialData}
        />
      );
    },
  },
];
