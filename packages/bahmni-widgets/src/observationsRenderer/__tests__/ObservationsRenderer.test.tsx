import { fetchFormMetadata, fetchObservationForms } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Observation } from 'fhir/r4';
import { ObservationsRenderer } from '../ObservationsRenderer';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  fetchObservationForms: jest.fn(),
  fetchFormMetadata: jest.fn(),
}));

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('ObservationsRenderer', () => {
  describe('Loading, Error, and Empty States', () => {
    it('should render loading state', () => {
      renderWithQueryClient(<ObservationsRenderer observations={[]} isLoading />);

      expect(
        screen.getByTestId('observations-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('should render error state with custom message', () => {
      renderWithQueryClient(
        <ObservationsRenderer
          observations={[]}
          isError
          errorMessage="Custom error message"
        />,
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should render error state with default message', () => {
      renderWithQueryClient(<ObservationsRenderer observations={[]} isError />);

      expect(
        screen.getByText('ERROR_LOADING_OBSERVATIONS'),
      ).toBeInTheDocument();
    });

    it('should render empty state with custom message', () => {
      renderWithQueryClient(
        <ObservationsRenderer
          observations={[]}
          emptyStateMessage="No data found"
        />,
      );

      expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('should render empty state with default message', () => {
      renderWithQueryClient(<ObservationsRenderer observations={[]} />);

      expect(screen.getByText('NO_OBSERVATIONS_AVAILABLE')).toBeInTheDocument();
    });
  });

  describe('Simple Observations', () => {
    it('should render observation without members', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Heart Rate',
        },
        valueQuantity: {
          value: 72,
          unit: 'bpm',
        },
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      expect(
        screen.getByTestId('observations-renderer-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-item-Heart Rate-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-label-Heart Rate-0'),
      ).toHaveTextContent('Heart Rate');
      expect(
        screen.getByTestId('observation-value-Heart Rate-0'),
      ).toHaveTextContent('72 bpm');
    });

    it('should render observation without units', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Result',
        },
        valueString: 'Positive',
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      expect(
        screen.getByTestId('observation-value-Result-0'),
      ).toHaveTextContent('Positive');
    });
  });

  describe('Boolean Observations', () => {
    it('should render boolean true value as true', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-bool-true',
        status: 'final',
        code: {
          text: 'Is Smoker',
        },
        valueBoolean: true,
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      expect(
        screen.getByTestId('observation-value-Is Smoker-0'),
      ).toHaveTextContent('YES');
    });

    it('should render boolean false value as false', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-bool-false',
        status: 'final',
        code: {
          text: 'Is Smoker',
        },
        valueBoolean: false,
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      expect(
        screen.getByTestId('observation-value-Is Smoker-0'),
      ).toHaveTextContent('NO');
    });
  });

  describe('Reference Ranges', () => {
    it('should render observation with low and high reference range', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Blood Glucose',
        },
        valueQuantity: {
          value: 95,
          unit: 'mg/dL',
        },
        referenceRange: [
          {
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'normal',
                },
              ],
            },
            low: { value: 70 },
            high: { value: 100 },
          },
        ],
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      const label = screen.getByTestId('observation-label-Blood Glucose-0');
      expect(label).toHaveTextContent('Blood Glucose');
      expect(label).toHaveTextContent('(70 - 100)');
      expect(
        screen.getByTestId('observation-value-Blood Glucose-0'),
      ).toHaveTextContent('95 mg/dL');
    });

    it('should render observation with only low reference range', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Hemoglobin',
        },
        valueQuantity: {
          value: 13,
          unit: 'g/dL',
        },
        referenceRange: [
          {
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'normal',
                },
              ],
            },
            low: { value: 12 },
          },
        ],
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      expect(
        screen.getByTestId('observation-label-Hemoglobin-0'),
      ).toHaveTextContent('(>12)');
    });

    it('should render observation with only high reference range', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Blood Pressure',
        },
        valueQuantity: {
          value: 115,
          unit: 'mmHg',
        },
        referenceRange: [
          {
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'normal',
                },
              ],
            },
            high: { value: 120 },
          },
        ],
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      expect(
        screen.getByTestId('observation-label-Blood Pressure-0'),
      ).toHaveTextContent('(<120)');
    });
  });

  describe('Abnormal Values', () => {
    it('should render abnormal observation with proper styling', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'High Temperature',
        },
        valueQuantity: {
          value: 39.5,
          unit: '°C',
        },
        interpretation: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'A',
              },
            ],
          },
        ],
        referenceRange: [
          {
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'normal',
                },
              ],
            },
            high: { value: 37.5 },
          },
        ],
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      const label = screen.getByTestId('observation-label-High Temperature-0');
      const value = screen.getByTestId('observation-value-High Temperature-0');

      expect(label).toHaveClass('abnormalValue');
      expect(value).toHaveClass('abnormalValue');
    });

    it('should render abnormal values in grouped observations', () => {
      const groupObservation: Observation = {
        resourceType: 'Observation',
        id: 'group-1',
        status: 'final',
        code: {
          text: 'Liver Function',
        },
        hasMember: [{ reference: 'Observation/member-1' }],
      };

      const altMember: Observation = {
        resourceType: 'Observation',
        id: 'member-1',
        status: 'final',
        code: {
          text: 'ALT',
        },
        valueQuantity: {
          value: 150,
          unit: 'U/L',
        },
        interpretation: [
          {
            coding: [
              {
                system:
                  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: 'A',
              },
            ],
          },
        ],
        referenceRange: [
          {
            type: {
              coding: [
                {
                  system:
                    'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
                  code: 'normal',
                },
              ],
            },
            high: { value: 40 },
          },
        ],
      };

      renderWithQueryClient(
        <ObservationsRenderer observations={[groupObservation, altMember]} />,
      );

      const memberLabel = screen.getByTestId('obs-member-label-ALT-0');
      const memberValue = screen.getByTestId('obs-member-value-ALT-0');

      expect(memberLabel).toHaveClass('abnormalValue');
      expect(memberValue).toHaveClass('abnormalValue');
      expect(memberLabel).toHaveTextContent('(<40)');
    });
  });

  describe('Grouped Observations', () => {
    it('should render grouped observations with members', () => {
      const groupObservation: Observation = {
        resourceType: 'Observation',
        id: 'group-1',
        status: 'final',
        code: {
          text: 'Complete Blood Count',
        },
        hasMember: [
          { reference: 'Observation/member-1' },
          { reference: 'Observation/member-2' },
        ],
      };

      const member1: Observation = {
        resourceType: 'Observation',
        id: 'member-1',
        status: 'final',
        code: {
          text: 'WBC',
        },
        valueQuantity: {
          value: 7000,
          unit: 'cells/μL',
        },
      };

      const member2: Observation = {
        resourceType: 'Observation',
        id: 'member-2',
        status: 'final',
        code: {
          text: 'RBC',
        },
        valueQuantity: {
          value: 4.5,
          unit: 'million/μL',
        },
      };

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[groupObservation, member1, member2]}
        />,
      );

      expect(
        screen.getByTestId('observation-label-Complete Blood Count-0'),
      ).toHaveTextContent('Complete Blood Count');
      expect(
        screen.getByTestId('observation-group-members-Complete Blood Count-0'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('obs-member-row-WBC-0')).toBeInTheDocument();
      expect(screen.getByTestId('obs-member-label-WBC-0')).toHaveTextContent(
        'WBC',
      );
      expect(screen.getByTestId('obs-member-value-WBC-0')).toHaveTextContent(
        '7000 cells/μL',
      );
      expect(screen.getByTestId('obs-member-row-RBC-1')).toBeInTheDocument();
    });

    it('should render nested grouped observations', () => {
      const panelObservation: Observation = {
        resourceType: 'Observation',
        id: 'group-1',
        status: 'final',
        code: {
          text: 'Panel',
        },
        hasMember: [{ reference: 'Observation/nested-group-1' }],
      };

      const subPanelObservation: Observation = {
        resourceType: 'Observation',
        id: 'nested-group-1',
        status: 'final',
        code: {
          text: 'Sub Panel',
        },
        hasMember: [{ reference: 'Observation/member-1' }],
      };

      const nestedValue: Observation = {
        resourceType: 'Observation',
        id: 'member-1',
        status: 'final',
        code: {
          text: 'Nested Value',
        },
        valueQuantity: {
          value: 100,
          unit: 'mg/dL',
        },
      };

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[panelObservation, subPanelObservation, nestedValue]}
        />,
      );

      expect(
        screen.getByTestId('obs-nested-group-Sub Panel-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('obs-nested-group-label-Sub Panel-0'),
      ).toHaveTextContent('Sub Panel');
      expect(
        screen.getByTestId('obs-member-row-Nested Value-0'),
      ).toBeInTheDocument();
    });
  });

  describe('Multi-select Observations', () => {
    it('should render multiselect observation values as comma separated', () => {
      const obs1: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Simple Test',
          coding: [{ code: '12345' }],
        },
        valueQuantity: {
          value: 10,
          unit: 'mg',
        },
      };

      const obs2: Observation = {
        resourceType: 'Observation',
        id: 'obs-2',
        status: 'final',
        code: {
          text: 'Simple Test',
          coding: [{ code: '12345' }],
        },
        valueQuantity: {
          value: 20,
          unit: 'mg',
        },
      };

      renderWithQueryClient(<ObservationsRenderer observations={[obs1, obs2]} />);

      expect(
        screen.getByTestId('observation-item-Simple Test-0'),
      ).toBeInTheDocument();

      expect(
        screen.getByTestId('observation-item-Simple Test-0'),
      ).toHaveTextContent('10, 20 mg');
    });
  });

  describe('Comments', () => {
    it('should render observation with comment', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Temperature',
        },
        valueQuantity: {
          value: 102.5,
          unit: '°F',
        },
        note: [{ text: 'Patient has fever' }],
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      expect(
        screen.getByTestId('observation-comment-Temperature-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-comment-Temperature-0'),
      ).toHaveTextContent('Patient has fever');
    });

    it('should render member observation with comment', () => {
      const groupObservation: Observation = {
        resourceType: 'Observation',
        id: 'group-1',
        status: 'final',
        code: {
          text: 'Vitals',
        },
        hasMember: [{ reference: 'Observation/member-1' }],
      };

      const member: Observation = {
        resourceType: 'Observation',
        id: 'member-1',
        status: 'final',
        code: {
          text: 'Pulse',
        },
        valueQuantity: {
          value: 80,
          unit: 'bpm',
        },
        note: [{ text: 'Slightly elevated' }],
      };

      renderWithQueryClient(
        <ObservationsRenderer observations={[groupObservation, member]} />,
      );

      expect(
        screen.getByTestId('obs-member-comment-Pulse-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('obs-member-comment-Pulse-0'),
      ).toHaveTextContent('Slightly elevated');
    });
  });

  describe('Media Support', () => {
    it('should render image tile for image values', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'X-Ray',
        },
        valueString: 'https://example.com/xray.jpg',
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      const imageTile = screen.getByTestId(
        'https://example.com/xray.jpg-img-test-id',
      );
      expect(imageTile).toBeInTheDocument();
    });

    it('should render video tile for video values', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Procedure Video',
        },
        valueString: 'https://example.com/procedure.mp4',
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      const videoTile = screen.getByTestId(
        'https://example.com/procedure.mp4-video-test-id',
      );
      expect(videoTile).toBeInTheDocument();
    });

    it('should render file tile for PDF values', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Report',
        },
        valueString: 'https://example.com/report.pdf',
      };

      renderWithQueryClient(<ObservationsRenderer observations={[mockObservation]} />);

      const fileTile = screen.getByTestId(
        'https://example.com/report.pdf-pdf-test-id',
      );
      expect(fileTile).toBeInTheDocument();
    });

    it('should render all images when multiple images have same conceptId', () => {
      const obs1: Observation = {
        resourceType: 'Observation',
        id: 'obs-img-1',
        status: 'final',
        code: {
          text: 'Patient Photo',
          coding: [{ code: 'photo-concept' }],
        },
        valueString: 'https://example.com/photo1.jpg',
      };

      const obs2: Observation = {
        resourceType: 'Observation',
        id: 'obs-img-2',
        status: 'final',
        code: {
          text: 'Patient Photo',
          coding: [{ code: 'photo-concept' }],
        },
        valueString: 'https://example.com/photo2.jpg',
      };

      renderWithQueryClient(<ObservationsRenderer observations={[obs1, obs2]} />);

      expect(
        screen.getByTestId('https://example.com/photo1.jpg-img-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('https://example.com/photo2.jpg-img-test-id'),
      ).toBeInTheDocument();
    });

    it('should render all images when multiple images are members of a group', () => {
      const groupObservation: Observation = {
        resourceType: 'Observation',
        id: 'group-img',
        status: 'final',
        code: {
          text: 'Image Group',
        },
        hasMember: [
          { reference: 'Observation/img-member-1' },
          { reference: 'Observation/img-member-2' },
        ],
      };

      const imgMember1: Observation = {
        resourceType: 'Observation',
        id: 'img-member-1',
        status: 'final',
        code: {
          text: 'Scan Image',
          coding: [{ code: 'scan-concept' }],
        },
        valueString: 'https://example.com/scan1.png',
      };

      const imgMember2: Observation = {
        resourceType: 'Observation',
        id: 'img-member-2',
        status: 'final',
        code: {
          text: 'Scan Image',
          coding: [{ code: 'scan-concept' }],
        },
        valueString: 'https://example.com/scan2.png',
      };

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[groupObservation, imgMember1, imgMember2]}
        />,
      );

      expect(
        screen.getByTestId('https://example.com/scan1.png-img-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('https://example.com/scan2.png-img-test-id'),
      ).toBeInTheDocument();
    });
  });

  describe('Test ID Prefix', () => {
    it('should apply testIdPrefix to observation test IDs', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Heart Rate',
        },
        valueQuantity: {
          value: 72,
          unit: 'bpm',
        },
      };

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[mockObservation]}
          testIdPrefix="MyForm"
        />,
      );

      expect(
        screen.getByTestId('MyForm-observation-item-Heart Rate-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('MyForm-observation-label-Heart Rate-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('MyForm-observation-value-Heart Rate-0'),
      ).toBeInTheDocument();
    });

    it('should apply testIdPrefix to grouped observation test IDs', () => {
      const groupObservation: Observation = {
        resourceType: 'Observation',
        id: 'group-1',
        status: 'final',
        code: {
          text: 'Panel',
        },
        hasMember: [{ reference: 'Observation/member-1' }],
      };

      const member: Observation = {
        resourceType: 'Observation',
        id: 'member-1',
        status: 'final',
        code: {
          text: 'Value',
        },
        valueQuantity: {
          value: 100,
          unit: 'mg',
        },
      };

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[groupObservation, member]}
          testIdPrefix="FormName"
        />,
      );

      expect(
        screen.getByTestId('FormName-observation-item-Panel-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('FormName-obs-member-row-Value-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('FormName-obs-member-label-Value-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('FormName-obs-member-value-Value-0'),
      ).toBeInTheDocument();
    });
  });

  describe('default sorting behavior', () => {
    it('should fall back to sortId numeric ordering when formName is not provided', () => {
      const makeObs = (
        id: string,
        display: string,
        controlId: string,
      ): Observation => ({
        resourceType: 'Observation',
        id,
        status: 'final',
        code: { text: display },
        valueString: display,
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
            valueString: `Bahmni^SecondVitals.1/${controlId}-0`,
          },
        ],
      });

      // Without formName, sort is numeric: 14, 18, 25
      const pulse = makeObs('obs-pulse', 'Pulse', '14');
      const lowBirthWeight = makeObs('obs-lbw', 'LowBirthWeight', '25');
      const temperature = makeObs('obs-temp', 'Temperature', '18');

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[pulse, lowBirthWeight, temperature]}
        />,
      );

      // Numeric sort: 14-0 → 18-0 → 25-0
      expect(
        screen.getByTestId('observation-item-Pulse-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-item-Temperature-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-item-LowBirthWeight-2'),
      ).toBeInTheDocument();
    });
  });

  describe('section headers from form schema', () => {
    const makeObsWithSortId = (
      id: string,
      display: string,
      controlId: string,
    ): Observation => ({
      resourceType: 'Observation',
      id,
      status: 'final',
      code: { text: display },
      valueString: display,
      extension: [
        {
          url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
          valueString: `Bahmni^TestForm.1/${controlId}-0`,
        },
      ],
    });

    it('should not render any section labels when formName is not provided', () => {
      const obs = makeObsWithSortId('obs-30', 'Sign/symptom name', '30');

      renderWithQueryClient(<ObservationsRenderer observations={[obs]} />);

      // Renders as standalone row when no formName
      expect(
        screen.getByTestId('observation-item-Sign/symptom name-0'),
      ).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Test',
        },
        valueString: 'Result',
      };

      const { container } = renderWithQueryClient(
        <ObservationsRenderer
          observations={[mockObservation]}
          className="custom-class"
        />,
      );

      const renderer = container.querySelector('.custom-class');
      expect(renderer).toBeInTheDocument();
    });
  });

  describe('formName prop', () => {
    const mockFetchObservationForms =
      fetchObservationForms as jest.MockedFunction<
        typeof fetchObservationForms
      >;
    const mockFetchFormMetadata = fetchFormMetadata as jest.MockedFunction<
      typeof fetchFormMetadata
    >;

    const makeObs = (
      id: string,
      display: string,
      controlId: string,
    ): Observation => ({
      resourceType: 'Observation',
      id,
      status: 'final',
      code: { text: display },
      valueString: display,
      extension: [
        {
          url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
          valueString: `Bahmni^Vitals.1/${controlId}-0`,
        },
      ],
    });

    const vitalsForm = {
      uuid: 'form-uuid-1',
      name: 'Vitals',
      id: 1,
      privileges: [],
    };

    const vitalsMetadata = {
      uuid: 'form-uuid-1',
      name: 'Vitals',
      version: '1',
      published: true,
      schema: {
        controls: [
          {
            id: 100,
            type: 'section',
            label: { value: 'Vitals Section' },
            controls: [{ id: 31 }, { id: 30 }],
          },
        ],
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should derive control order and section grouping from the named form schema', async () => {
      mockFetchObservationForms.mockResolvedValue([vitalsForm]);
      mockFetchFormMetadata.mockResolvedValue(vitalsMetadata);

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[makeObs('obs-30', 'Pulse', '30')]}
          formName="Vitals"
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('section-label-Vitals Section'),
        ).toHaveTextContent('Vitals Section');
      });
      expect(mockFetchFormMetadata).toHaveBeenCalledWith('form-uuid-1');
      expect(screen.getByTestId('obs-member-row-Pulse-0')).toBeInTheDocument();
    });

    it('should show the loading skeleton while the form schema is being fetched', () => {
      mockFetchObservationForms.mockReturnValue(new Promise(() => {}));
      mockFetchFormMetadata.mockReturnValue(new Promise(() => {}));

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[makeObs('obs-30', 'Pulse', '30')]}
          formName="Vitals"
        />,
      );

      expect(
        screen.getByTestId('observations-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('should render the error state when the form metadata fetch fails', async () => {
      mockFetchObservationForms.mockResolvedValue([vitalsForm]);
      mockFetchFormMetadata.mockRejectedValue(new Error('metadata boom'));

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[makeObs('obs-30', 'Pulse', '30')]}
          formName="Vitals"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('metadata boom')).toBeInTheDocument();
      });
      expect(screen.queryByText('Pulse')).not.toBeInTheDocument();
    });

    it('should fall back to sortId ordering when no published form matches the name', async () => {
      mockFetchObservationForms.mockResolvedValue([
        { uuid: 'other-uuid', name: 'Some Other Form', id: 2, privileges: [] },
      ]);

      renderWithQueryClient(
        <ObservationsRenderer
          observations={[makeObs('obs-30', 'Pulse', '30')]}
          formName="Vitals"
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('observation-item-Pulse-0'),
        ).toBeInTheDocument();
      });
      expect(mockFetchFormMetadata).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId('section-label-Vitals Section'),
      ).not.toBeInTheDocument();
    });
  });
});
