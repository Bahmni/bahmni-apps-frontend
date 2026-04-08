import { useTranslation } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RegistrationFormSection } from '../../../providers/registrationConfig/models';
import { FormControlRefs, FormControlData, FormControlGuards } from '../models';
import PatientRegisterSection from '../PatientRegisterSection';

// Mock useTranslation
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));

// Mock the formSectionMap
jest.mock('../formSectionMap', () => ({
  builtInFormSections: [
    {
      type: 'profile',
      component: () => <div data-testid="profile-component">Profile</div>,
      render: () => <div data-testid="profile-component">Profile</div>,
    },
    {
      type: 'address',
      component: () => <div data-testid="address-component">Address</div>,
      render: () => <div data-testid="address-component">Address</div>,
    },
    {
      type: 'unknownType',
      component: () => null,
      render: () => null,
    },
  ],
}));

const mockTranslate = jest.fn((key: string) => key);

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

const mockGuards: FormControlGuards = {
  shouldShowAdditionalIdentifiers: true,
  relationshipTypes: [],
};

describe('PatientRegisterSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: mockTranslate });
  });

  describe('conditional rendering', () => {
    it('should render null when all controls have unknown types', () => {
      const section: RegistrationFormSection = {
        name: 'empty-section',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'unknownType' }],
      };

      const { container } = render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render section header tile when section has translationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      const headerTile = screen.getByTestId('section-header-tile');
      expect(headerTile).toBeInTheDocument();
      expect(headerTile).toHaveTextContent('SECTION_TITLE');
    });

    it('should not render section header tile when section has no translationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        controls: [{ type: 'profile' }],
      };

      const { queryByTestId } = render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      expect(queryByTestId('section-header-tile')).not.toBeInTheDocument();
    });

    it('should render control title when control has titleTranslationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        controls: [{ type: 'profile', titleTranslationKey: 'CONTROL_TITLE' }],
      };

      render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      const controlTitle = screen.getByTestId('control-title-profile');
      expect(controlTitle).toBeInTheDocument();
      expect(controlTitle).toHaveTextContent('CONTROL_TITLE');
    });

    it('should not render control title when control has no titleTranslationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        controls: [{ type: 'profile' }],
      };

      const { queryByTestId } = render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      expect(queryByTestId('control-title-profile')).not.toBeInTheDocument();
    });
  });

  describe('multiple controls', () => {
    it('should render multiple controls in a single section', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        translationKey: 'BASIC_INFO',
        controls: [
          { type: 'profile', titleTranslationKey: 'PROFILE_TITLE' },
          { type: 'address', titleTranslationKey: 'ADDRESS_TITLE' },
        ],
      };

      render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      expect(screen.getByTestId('profile-component')).toBeInTheDocument();
      expect(screen.getByTestId('address-component')).toBeInTheDocument();
      expect(screen.getByTestId('control-title-profile')).toBeInTheDocument();
      expect(screen.getByTestId('control-title-address')).toBeInTheDocument();
    });
  });

  describe('unknown types handling', () => {
    it('should skip unrecognized control types while rendering valid ones', () => {
      const section: RegistrationFormSection = {
        name: 'mixed-section',
        translationKey: 'MIXED_SECTION',
        controls: [
          { type: 'profile' },
          { type: 'unknownType' },
          { type: 'address' },
        ],
      };

      render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      // Should render valid controls
      expect(screen.getByTestId('profile-component')).toBeInTheDocument();
      expect(screen.getByTestId('address-component')).toBeInTheDocument();

      // Should still have header tile
      expect(screen.getByTestId('section-header-tile')).toBeInTheDocument();
    });
  });

  describe('translation calls', () => {
    it('should call t() for section translationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        translationKey: 'SECTION_TITLE',
        controls: [{ type: 'profile' }],
      };

      render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      expect(mockTranslate).toHaveBeenCalledWith('SECTION_TITLE');
    });

    it('should call t() for control titleTranslationKey', () => {
      const section: RegistrationFormSection = {
        name: 'basic-info',
        controls: [{ type: 'profile', titleTranslationKey: 'CONTROL_TITLE' }],
      };

      render(
        <PatientRegisterSection
          section={section}
          refs={mockRefs}
          data={mockData}
          guards={mockGuards}
        />,
      );

      expect(mockTranslate).toHaveBeenCalledWith('CONTROL_TITLE');
    });
  });
});
