import { AdditionalIdentifiers } from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import { AdditionalInfo } from '../../components/forms/additionalInfo/AdditionalInfo';
import { AddressInfo } from '../../components/forms/addressInfo/AddressInfo';
import { ContactInfo } from '../../components/forms/contactInfo/ContactInfo';
import { PatientRelationships } from '../../components/forms/patientRelationships/PatientRelationships';
import { FormSectionConfig } from './models';

export const builtInFormSections: FormSectionConfig[] = [
  {
    type: 'address',
    render: (refs, data) => (
      <AddressInfo
        ref={refs.addressRef}
        initialData={data.addressInitialData}
      />
    ),
  },
  {
    type: 'contactInfo',
    render: (refs, data) => (
      <ContactInfo
        ref={refs.contactRef}
        initialData={data.personAttributesInitialData}
      />
    ),
  },
  {
    type: 'additionalInfo',
    render: (refs, data) => (
      <AdditionalInfo
        ref={refs.additionalRef}
        initialData={data.personAttributesInitialData}
      />
    ),
  },
  {
    type: 'additionalIdentifiers',
    render: (refs, data, guards) => {
      if (!guards.shouldShowAdditionalIdentifiers) return null;
      return (
        <AdditionalIdentifiers
          ref={refs.additionalIdentifiersRef}
          initialData={data.additionalIdentifiersInitialData}
        />
      );
    },
  },
  {
    type: 'relationships',
    render: (refs, data, guards) => {
      if (
        !Array.isArray(guards.relationshipTypes) ||
        guards.relationshipTypes.length === 0
      ) {
        return null;
      }
      return (
        <PatientRelationships
          ref={refs.relationshipsRef}
          initialData={data.relationshipsInitialData}
        />
      );
    },
  },
];
