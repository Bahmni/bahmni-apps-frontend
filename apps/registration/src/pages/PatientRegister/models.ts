import type { AdditionalIdentifiersRef } from '../../components/forms/additionalIdentifiers/AdditionalIdentifiers';
import type { AdditionalInfoRef } from '../../components/forms/additionalInfo/AdditionalInfo';
import type { AddressInfoRef } from '../../components/forms/addressInfo/AddressInfo';
import type { ContactInfoRef } from '../../components/forms/contactInfo/ContactInfo';
import type {
  PatientRelationshipsRef,
  RelationshipData,
} from '../../components/forms/patientRelationships/PatientRelationships';
import type { RelationshipType } from '../../components/forms/patientRelationships/RelationshipRow';
import type { ProfileRef } from '../../components/forms/profile/Profile';
import type { AddressData } from '../../hooks/useAddressFields';
import type {
  BasicInfoData,
  PersonAttributesData,
  AdditionalIdentifiersData,
} from '../../models/patient';

export interface FormControlRefs {
  profileRef: React.RefObject<ProfileRef | null>;
  addressRef: React.RefObject<AddressInfoRef | null>;
  contactRef: React.RefObject<ContactInfoRef | null>;
  additionalRef: React.RefObject<AdditionalInfoRef | null>;
  additionalIdentifiersRef: React.RefObject<AdditionalIdentifiersRef | null>;
  relationshipsRef: React.RefObject<PatientRelationshipsRef | null>;
}

export interface FormControlData {
  profileInitialData: BasicInfoData | undefined;
  addressInitialData: AddressData | undefined;
  personAttributesInitialData: PersonAttributesData | undefined;
  additionalIdentifiersInitialData: AdditionalIdentifiersData | undefined;
  relationshipsInitialData: RelationshipData[] | undefined;
  initialDobEstimated: boolean;
  patientPhoto: string | undefined;
}

export interface FormControlGuards {
  shouldShowAdditionalIdentifiers: boolean;
  relationshipTypes: RelationshipType[];
}

export interface FormSectionConfig {
  type: string;
  render: (
    refs: FormControlRefs,
    data: FormControlData,
    guards: FormControlGuards,
  ) => React.ReactNode;
}
