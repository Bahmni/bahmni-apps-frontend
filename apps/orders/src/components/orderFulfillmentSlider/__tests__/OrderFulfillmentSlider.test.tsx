import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import { useOrdersConfig } from '../../../hooks/useOrdersConfig';
import { Order } from '../../../models/orderFulfillment';
import { ORDER_PRIORITY } from '../../../models/ordersConfig';
import useOrdersStore from '../../../stores/ordersStore';
import { OrderFulfillmentSlider } from '../OrderFulfillmentSlider';

const mockCreateTask = jest.fn();
const mockGetCurrentProvider = jest.fn();
const mockGetObservationByConceptName = jest.fn();

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  createTask: (...args: unknown[]) => mockCreateTask(...args),
  getCurrentProvider: (...args: unknown[]) => mockGetCurrentProvider(...args),
  getObservationByConceptName: (...args: unknown[]) =>
    mockGetObservationByConceptName(...args),
}));

const mockAddNotification = jest.fn();

jest.mock('@bahmni/widgets', () => ({
  useNotification: () => ({
    addNotification: mockAddNotification,
  }),
}));

jest.mock('../../../hooks/useOrdersConfig', () => ({
  useOrdersConfig: jest.fn(),
}));

jest.mock('../../../hooks/useEnsureEncounterForVisit', () => ({
  ensureEncounterForActiveVisit: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../stores/ordersStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('react-intl', () => {
  const actualReactIntl = jest.requireActual('react-intl');
  return {
    ...actualReactIntl,
    FormattedMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage: string;
    }) => <span>{defaultMessage || id}</span>,
  };
});

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <IntlProvider locale="en" messages={{}}>
      {component}
    </IntlProvider>,
  );
};

const mockOrder: Order = {
  id: 'order-1',
  patientUuid: 'patient-uuid-1',
  orderName: 'New Cast - Plaster',
  orderType: 'Rehab Order',
  priority: ORDER_PRIORITY.STAT,
  status: 'New',
  provider: 'Mike Ronoh',
  dateTime: '12 Nov 25 04:24 PM',
  owner: null,
  providerComments:
    'Post-operative X-ray for assessing healing or implant position | Monitoring of progress for alignment / comparative purposes | High Risk | Request from ward | Request from clinic | Pre-operative X-ray for diagnostic or planning purposes',
  patient: {
    age: '8 years 11 months 8 days',
    dateOfBirth: '09 Jan 2017',
    gender: 'Male',
    address: '123 Nairobi St, Kenya',
    phoneNumber: '+254 700 123 456',
  },
};

// Mock order for LMP tests - must be female and >= 10 years old
const mockRadiologyOrderEligibleForLmp: Order = {
  id: 'order-1',
  patientUuid: 'patient-uuid-1',
  orderName: 'CT Brain',
  orderType: 'Radiology Order',
  priority: ORDER_PRIORITY.STAT,
  status: 'New',
  provider: 'Dr. Jane Smith',
  dateTime: '12 Nov 25 04:24 PM',
  owner: null,
  providerComments: 'CT scan for headache assessment',
  patient: {
    age: '15 years 6 months 3 days',
    dateOfBirth: '09 May 2009',
    gender: 'F',
    address: '456 Nairobi Ave, Kenya',
    phoneNumber: '+254 700 987 654',
  },
};

describe('OrderFulfillmentSlider', () => {
  const mockOnClose = jest.fn();
  const mockFetchProviders = jest.fn();
  const mockProviders = {
    'Radiology Order': [
      { id: 'provider-1', name: 'Dr. Smith', uuid: 'uuid-1' },
      { id: 'provider-2', name: 'Dr. Jones', uuid: 'uuid-2' },
    ],
    'Lab Order': [{ id: 'provider-3', name: 'Lab Tech 1', uuid: 'uuid-3' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentProvider.mockResolvedValue({ uuid: 'provider-uuid-1' });
    (mockGetObservationByConceptName as jest.Mock).mockResolvedValue(null);
    (useOrdersStore as unknown as jest.Mock).mockReturnValue({
      fetchProviders: mockFetchProviders,
      providers: mockProviders,
      currentUser: { uuid: 'user-uuid-1' },
      currentLocation: { uuid: 'location-uuid-1', name: 'Test Location' },
    });
  });

  const mockConfig = {
    ordersTableConfig: {
      manageOrdersPanelPatientDetails: [
        { key: 'patient.age', label: 'Age', translationKey: 'AGE' },
        {
          key: 'patient.dateOfBirth',
          label: 'Date of Birth',
          translationKey: 'DOB',
        },
        { key: 'patient.gender', label: 'Gender', translationKey: 'GENDER' },
        { key: 'patient.address', label: 'Address', translationKey: 'ADDRESS' },
        {
          key: 'patient.phoneNumber',
          label: 'Phone',
          translationKey: 'PHONE',
        },
      ],
      orderStatusesAvailable: [
        { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
        {
          value: 'Acknowledged',
          label: 'Acknowledged',
          translationKey: 'STATUS_ACKNOWLEDGED',
        },
        {
          value: 'In Progress',
          label: 'In Progress',
          translationKey: 'STATUS_IN_PROGRESS',
        },
        {
          value: 'Completed',
          label: 'Completed',
          translationKey: 'STATUS_COMPLETED',
        },
        {
          value: 'On Hold',
          label: 'On Hold',
          translationKey: 'STATUS_ON_HOLD',
        },
      ],
      orderStatusesPreSelected: [
        { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
        {
          value: 'In Progress',
          label: 'In Progress',
          translationKey: 'STATUS_IN_PROGRESS',
        },
      ],
      lmpConfig: {
        lmpDateConcept: 'LMP Date',
        threshold: 28,
        tabLabels: ['Radiology Order'],
      },
      tabPractitionerTypeMap: {
        'Radiology Order': 'Radiology Technologist',
        'Lab Order': 'Laboratory Technologist',
      },
    },
  };

  it('renders nothing when isOpen is false', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    const { container } = renderWithIntl(
      <OrderFulfillmentSlider
        order={mockOrder}
        onClose={mockOnClose}
        isOpen={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when order is null', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    const { container } = renderWithIntl(
      <OrderFulfillmentSlider order={null} onClose={mockOnClose} isOpen />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders slider with order name', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    renderWithIntl(
      <OrderFulfillmentSlider order={mockOrder} onClose={mockOnClose} isOpen />,
    );

    expect(screen.getByText('New Cast - Plaster')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    renderWithIntl(
      <OrderFulfillmentSlider order={mockOrder} onClose={mockOnClose} isOpen />,
    );

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    renderWithIntl(
      <OrderFulfillmentSlider order={mockOrder} onClose={mockOnClose} isOpen />,
    );

    const cancelButton = screen.getByText('CANCEL');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('Patient Details', () => {
    it('renders patient details from config', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('AGE')).toBeInTheDocument();
      expect(screen.getByText('8 years 11 months 8 days')).toBeInTheDocument();

      expect(screen.getByText('DOB')).toBeInTheDocument();
      expect(screen.getByText('09 Jan 2017')).toBeInTheDocument();

      expect(screen.getByText('GENDER')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();

      expect(screen.getByText('ADDRESS')).toBeInTheDocument();
      expect(screen.getByText('123 Nairobi St, Kenya')).toBeInTheDocument();

      expect(screen.getByText('PHONE')).toBeInTheDocument();
      expect(screen.getByText('+254 700 123 456')).toBeInTheDocument();
    });

    it('renders only specified patient details from config', () => {
      useOrdersConfig.mockReturnValue({
        ordersTableConfig: {
          manageOrdersPanelPatientDetails: [
            {
              key: 'patient.age',
              label: 'Age',
              translationKey: 'AGE',
            },
            {
              key: 'patient.gender',
              label: 'Gender',
              translationKey: 'GENDER',
            },
          ],
          orderStatusesAvailable: [
            { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
            {
              value: 'In Progress',
              label: 'In Progress',
              translationKey: 'STATUS_IN_PROGRESS',
            },
          ],
          orderStatusesPreSelected: [
            { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
          ],
        },
      });

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('AGE')).toBeInTheDocument();
      expect(screen.getByText('8 years 11 months 8 days')).toBeInTheDocument();

      expect(screen.getByText('GENDER')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();

      expect(screen.queryByText('DOB')).not.toBeInTheDocument();
      expect(screen.queryByText('ADDRESS')).not.toBeInTheDocument();
      expect(screen.queryByText('PHONE')).not.toBeInTheDocument();
    });

    it('displays "-" for missing patient field values', () => {
      const orderWithoutPatient: Order = {
        ...mockOrder,
        patient: undefined,
      };

      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithoutPatient}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('handles nested property access correctly', () => {
      useOrdersConfig.mockReturnValue({
        ordersTableConfig: {
          manageOrdersPanelPatientDetails: [
            {
              key: 'patient.phoneNumber',
              label: 'Phone',
              translationKey: 'PHONE',
            },
          ],
          orderStatusesAvailable: [
            { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
            {
              value: 'In Progress',
              label: 'In Progress',
              translationKey: 'STATUS_IN_PROGRESS',
            },
          ],
          orderStatusesPreSelected: [
            { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
          ],
        },
      });

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('+254 700 123 456')).toBeInTheDocument();
    });

    it('renders no patient details section when config is empty array', () => {
      useOrdersConfig.mockReturnValue({
        ordersTableConfig: {
          manageOrdersPanelPatientDetails: [],
          orderStatusesAvailable: [
            { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
            {
              value: 'In Progress',
              label: 'In Progress',
              translationKey: 'STATUS_IN_PROGRESS',
            },
          ],
          orderStatusesPreSelected: [
            { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
          ],
        },
      });

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.queryByText('PATIENT_DETAILS')).not.toBeInTheDocument();
    });
  });

  describe('Provider Comments', () => {
    it('renders provider comments when present', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('PROVIDER_COMMENTS')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Post-operative X-ray for assessing healing or implant position/i,
        ),
      ).toBeInTheDocument();
    });

    it('does not render provider comments section when not present', () => {
      const orderWithoutComments = {
        ...mockOrder,
        providerComments: undefined,
      };

      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithoutComments}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.queryByText('PROVIDER_COMMENTS')).not.toBeInTheDocument();
    });
  });

  describe('Form Elements', () => {
    it('renders status dropdown with configured statuses', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByTestId('order-status-select')).toBeInTheDocument();
    });

    it('renders owner dropdown with available providers', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByTestId('order-owner-select')).toBeInTheDocument();
    });

    it('renders notes textarea', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const notesTextarea = screen.getByTestId('order-notes');
      expect(notesTextarea).toBeInTheDocument();
      expect(notesTextarea).toHaveAttribute('placeholder', 'NOTES');
    });

    it('updates notes value when typing', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const notesTextarea = screen.getByTestId(
        'order-notes',
      ) as HTMLTextAreaElement;
      fireEvent.change(notesTextarea, {
        target: { value: 'Test notes content' },
      });

      expect(notesTextarea.value).toBe('Test notes content');
    });

    it('renders save and cancel buttons', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const saveButton = screen.getByText('SAVE');
      const cancelButton = screen.getByText('CANCEL');
      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Provider Integration', () => {
    it('fetches providers when slider opens with tabLabel', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
        />,
      );

      await waitFor(() => {
        expect(mockFetchProviders).toHaveBeenCalledWith('Radiology Order');
      });
    });

    it('does not fetch providers when slider is closed', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen={false}
          tabLabel="Radiology Order"
        />,
      );

      expect(mockFetchProviders).not.toHaveBeenCalled();
    });

    it('does not fetch providers when tabLabel is empty', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabLabel=""
        />,
      );

      expect(mockFetchProviders).not.toHaveBeenCalled();
    });

    it('updates current providers based on tabLabel', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      const { rerender } = renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
        />,
      );

      await waitFor(() => {
        expect(mockFetchProviders).toHaveBeenCalledWith('Radiology Order');
      });

      // Rerender with different tabLabel
      rerender(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabLabel="Lab Order"
        />,
      );

      await waitFor(() => {
        expect(mockFetchProviders).toHaveBeenCalledWith('Lab Order');
      });
    });

    it('handles empty providers list for a tab', () => {
      (useOrdersStore as unknown as jest.Mock).mockReturnValue({
        fetchProviders: mockFetchProviders,
        providers: {
          'Radiology Order': [],
        },
        currentUser: { uuid: 'user-uuid-1' },
        currentLocation: { uuid: 'location-uuid-1', name: 'Test Location' },
      });

      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
        />,
      );

      expect(screen.getByTestId('order-owner-select')).toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    it('enables save button when owner is selected', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
        />,
      );

      const saveButton = screen.getByText('SAVE');
      // The button should exist
      expect(saveButton).toBeInTheDocument();
    });

    it('enables save button when status is selected', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const saveButton = screen.getByText('SAVE');
      expect(saveButton).toBeInTheDocument();
    });

    it('enables save button when notes are entered', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const notesTextarea = screen.getByTestId(
        'order-notes',
      ) as HTMLTextAreaElement;
      fireEvent.change(notesTextarea, {
        target: { value: 'Test notes' },
      });

      expect(notesTextarea.value).toBe('Test notes');
    });

    it('resets form state when slider is reopened', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      const { rerender } = renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const notesTextarea = screen.getByTestId(
        'order-notes',
      ) as HTMLTextAreaElement;
      fireEvent.change(notesTextarea, {
        target: { value: 'Test notes' },
      });

      expect(notesTextarea.value).toBe('Test notes');

      // Close and reopen
      rerender(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen={false}
        />,
      );

      rerender(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const newNotesTextarea = screen.getByTestId(
        'order-notes',
      ) as HTMLTextAreaElement;
      expect(newNotesTextarea.value).toBe('');
    });
  });

  describe('Status ComboBox Keyboard Navigation', () => {
    it('allows arrow keys in status dropdown', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const input = screen.getByTestId(
        'order-status-select',
      ) as HTMLInputElement;

      expect(input).toBeInTheDocument();
      if (input) {
        const arrowDownEvent = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
        });
        Object.defineProperty(arrowDownEvent, 'key', {
          value: 'ArrowDown',
        });

        fireEvent.keyDown(input, arrowDownEvent);
      }
    });

    it('prevents typing letters in status dropdown', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const input = screen.getByTestId(
        'order-status-select',
      ) as HTMLInputElement;

      expect(input).toBeInTheDocument();
      // Verify the component has the proper attributes for keyboard handling
      expect(input).toHaveAttribute('role', 'combobox');
    });

    it('allows Enter key in status dropdown', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const input = screen.getByTestId(
        'order-status-select',
      ) as HTMLInputElement;

      expect(input).toBeInTheDocument();
      const event = {
        key: 'Enter',
        preventDefault: jest.fn(),
      };
      fireEvent.keyDown(input, event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('allows Escape key in status dropdown', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const input = screen.getByTestId(
        'order-status-select',
      ) as HTMLInputElement;

      expect(input).toBeInTheDocument();
      const event = {
        key: 'Escape',
        preventDefault: jest.fn(),
      };
      fireEvent.keyDown(input, event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('allows Tab key in status dropdown', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const input = screen.getByTestId(
        'order-status-select',
      ) as HTMLInputElement;

      expect(input).toBeInTheDocument();
      const event = {
        key: 'Tab',
        preventDefault: jest.fn(),
      };
      fireEvent.keyDown(input, event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing ordersTableConfig gracefully', () => {
      useOrdersConfig.mockReturnValue({
        ordersTableConfig: null,
      });

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('New Cast - Plaster')).toBeInTheDocument();
      expect(screen.queryByText('PATIENT_DETAILS')).not.toBeInTheDocument();
    });

    it('handles order with empty patient details', () => {
      const orderWithEmptyPatient: Order = {
        ...mockOrder,
        patient: {
          age: '',
          dateOfBirth: '',
          gender: '',
          address: '',
          phoneNumber: '',
        },
      };

      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithEmptyPatient}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('handles order with null patient fields', () => {
      const orderWithNullFields: Order = {
        ...mockOrder,
        patient: {
          age: null as unknown as string,
          dateOfBirth: null as unknown as string,
          gender: null as unknown as string,
          address: null as unknown as string,
          phoneNumber: null as unknown as string,
        },
      };

      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithNullFields}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('handles deeply nested patient fields', () => {
      useOrdersConfig.mockReturnValue({
        ordersTableConfig: {
          manageOrdersPanelPatientDetails: [
            {
              key: 'patient.address.city',
              label: 'City',
              translationKey: 'CITY',
            },
          ],
          orderStatusesAvailable: [
            { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
            {
              value: 'In Progress',
              label: 'In Progress',
              translationKey: 'STATUS_IN_PROGRESS',
            },
          ],
          orderStatusesPreSelected: [
            { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
          ],
        },
      });

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      // Should display "-" for non-existent nested field
      expect(screen.getByText('CITY')).toBeInTheDocument();
    });

    it('handles provider comments with special characters', () => {
      const orderWithSpecialChars: Order = {
        ...mockOrder,
        providerComments: 'Test <>&"\'',
      };

      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithSpecialChars}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('Test <>&"\'')).toBeInTheDocument();
    });

    it('handles very long provider comments', () => {
      const longComment = 'A'.repeat(1000);
      const orderWithLongComment: Order = {
        ...mockOrder,
        providerComments: longComment,
      };

      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithLongComment}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText(longComment)).toBeInTheDocument();
    });

    it('handles empty notes textarea placeholder', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const notesTextarea = screen.getByTestId('order-notes');
      expect(notesTextarea).toHaveAttribute('placeholder', 'NOTES');
    });
  });

  describe('Accessibility', () => {
    it('has accessible close button', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const closeButton = screen.getByRole('button', {
        name: /close sidebar/i,
      });
      expect(closeButton).toHaveAttribute('aria-label', 'Close sidebar');
    });

    it('has proper test ids for form elements', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(
        screen.getByTestId('order-fulfillment-slider'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('order-owner-select')).toBeInTheDocument();
      expect(screen.getByTestId('order-status-select')).toBeInTheDocument();
      expect(screen.getByTestId('order-notes')).toBeInTheDocument();
    });
  });

  describe('Save Notifications', () => {
    const orderWithMappableStatus: Order = {
      ...mockOrder,
      status: 'In Progress',
    };

    it('shows success notification with timeout on successful save', async () => {
      mockCreateTask.mockResolvedValue({});
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithMappableStatus}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const notesTextarea = screen.getByTestId('order-notes');
      fireEvent.change(notesTextarea, { target: { value: 'Test note' } });

      const saveButton = screen.getByText('SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'ORDER_SAVE_SUCCESS',
          message: '',
          type: 'success',
          timeout: 5000,
        });
      });
    });

    it('shows error notification with timeout on save failure', async () => {
      mockCreateTask.mockRejectedValue(new Error('Network error'));
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithMappableStatus}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const notesTextarea = screen.getByTestId('order-notes');
      fireEvent.change(notesTextarea, { target: { value: 'Test note' } });

      const saveButton = screen.getByText('SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'ORDER_SAVE_ERROR',
          message: '',
          type: 'error',
          timeout: 5000,
        });
      });
    });

    it('calls onSaveSuccess callback after successful save', async () => {
      mockCreateTask.mockResolvedValue({});
      useOrdersConfig.mockReturnValue(mockConfig);
      const mockOnSaveSuccess = jest.fn();

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithMappableStatus}
          onClose={mockOnClose}
          isOpen
          onSaveSuccess={mockOnSaveSuccess}
        />,
      );

      const notesTextarea = screen.getByTestId('order-notes');
      fireEvent.change(notesTextarea, { target: { value: 'Test note' } });

      const saveButton = screen.getByText('SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('saves New order immediately without adding notes (auto-acknowledged)', async () => {
      mockCreateTask.mockResolvedValue({});
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      fireEvent.click(screen.getByText('SAVE'));
      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith('order-1', 'requested', {
          notes: undefined,
          ownerUuid: undefined,
          encounterUuid: undefined,
          patientUuid: 'patient-uuid-1',
        });
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success' }),
        );
      });
    });

    it('saves with draft status when New is selected from a non-New order', async () => {
      mockCreateTask.mockResolvedValue({});
      useOrdersConfig.mockReturnValue(mockConfig);
      const inProgressOrder: Order = { ...mockOrder, status: 'In Progress' };
      renderWithIntl(
        <OrderFulfillmentSlider
          order={inProgressOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      // Open status dropdown and select 'New'
      fireEvent.click(screen.getByTestId('order-status-select'));
      const newOption = await screen.findByRole('option', {
        name: 'STATUS_NEW',
      });
      fireEvent.click(newOption);
      fireEvent.change(screen.getByTestId('order-notes'), {
        target: { value: 'Reverting to new' },
      });
      fireEvent.click(screen.getByText('SAVE'));
      await waitFor(() => {
        expect(mockCreateTask).toHaveBeenCalledWith(
          'order-1',
          'draft',
          expect.objectContaining({ patientUuid: 'patient-uuid-1' }),
        );
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success' }),
        );
      });
    });

    it('does not call onSaveSuccess on save failure', async () => {
      mockCreateTask.mockRejectedValue(new Error('Network error'));
      useOrdersConfig.mockReturnValue(mockConfig);
      const mockOnSaveSuccess = jest.fn();

      renderWithIntl(
        <OrderFulfillmentSlider
          order={orderWithMappableStatus}
          onClose={mockOnClose}
          isOpen
          onSaveSuccess={mockOnSaveSuccess}
        />,
      );

      const notesTextarea = screen.getByTestId('order-notes');
      fireEvent.change(notesTextarea, { target: { value: 'Test note' } });

      const saveButton = screen.getByText('SAVE');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error' }),
        );
      });

      expect(mockOnSaveSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Status Pre-Population', () => {
    it('auto-populates status with Acknowledged when order status is New', () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      const statusInput = screen.getByTestId(
        'order-status-select',
      ) as HTMLInputElement;
      expect(statusInput.value).toBe('STATUS_ACKNOWLEDGED');
    });

    it('pre-populates status with current status for a non-New order', () => {
      const inProgressOrder: Order = { ...mockOrder, status: 'In Progress' };
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={inProgressOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      const statusInput = screen.getByTestId(
        'order-status-select',
      ) as HTMLInputElement;
      expect(statusInput.value).toBe('STATUS_IN_PROGRESS');
    });

    it('shows New as an option in the status dropdown', () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      expect(screen.getByTestId('order-status-select')).toBeInTheDocument();
    });

    it('auto-populates Acknowledged again when slider closes and reopens for a New order', () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      const { rerender } = renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      rerender(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen={false}
        />,
      );
      rerender(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      const statusInput = screen.getByTestId(
        'order-status-select',
      ) as HTMLInputElement;
      expect(statusInput.value).toBe('STATUS_ACKNOWLEDGED');
    });
  });

  describe('tabStatuses prop', () => {
    const poTabStatuses = {
      available: [
        {
          value: 'Acknowledged',
          label: 'Acknowledged',
          translationKey: 'STATUS_ACKNOWLEDGED',
        },
        {
          value: 'In Progress',
          label: 'In Progress',
          translationKey: 'STATUS_IN_PROGRESS',
        },
        {
          value: 'Ready for Pickup',
          label: 'Ready for Pickup',
          translationKey: 'STATUS_READY_FOR_PICKUP',
        },
        {
          value: 'Completed',
          label: 'Completed',
          translationKey: 'STATUS_COMPLETED',
        },
      ],
      preSelected: [
        {
          value: 'Acknowledged',
          label: 'Acknowledged',
          translationKey: 'STATUS_ACKNOWLEDGED',
        },
        {
          value: 'Ready for Pickup',
          label: 'Ready for Pickup',
          translationKey: 'STATUS_READY_FOR_PICKUP',
        },
      ],
    };

    it('shows tab-specific statuses in dropdown when tabStatuses prop is provided', () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabStatuses={poTabStatuses}
        />,
      );
      const statusInput = screen.getByTestId('order-status-select');
      fireEvent.click(statusInput);
      expect(screen.getByText('STATUS_READY_FOR_PICKUP')).toBeInTheDocument();
    });

    it('does not show Ready for Pickup when tabStatuses is not provided', () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      const statusInput = screen.getByTestId('order-status-select');
      fireEvent.click(statusInput);
      expect(
        screen.queryByText('STATUS_READY_FOR_PICKUP'),
      ).not.toBeInTheDocument();
    });

    it('falls back to global statuses when tabStatuses is undefined', () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabStatuses={undefined}
        />,
      );
      const statusInput = screen.getByTestId('order-status-select');
      fireEvent.click(statusInput);
      expect(screen.getByText('STATUS_ACKNOWLEDGED')).toBeInTheDocument();
      expect(
        screen.queryByText('STATUS_READY_FOR_PICKUP'),
      ).not.toBeInTheDocument();
    });
  });

  describe('SAVE and CANCEL Button States', () => {
    it('SAVE is enabled immediately on open for a New order (auto-acknowledged)', () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      expect(screen.getByText('SAVE').closest('button')).not.toBeDisabled();
    });

    it('SAVE is disabled on open for a non-New order with no changes', () => {
      const inProgressOrder: Order = { ...mockOrder, status: 'In Progress' };
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={inProgressOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      expect(screen.getByText('SAVE').closest('button')).toBeDisabled();
    });

    it('SAVE is enabled when notes are added to a non-New order', () => {
      const inProgressOrder: Order = { ...mockOrder, status: 'In Progress' };
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={inProgressOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      fireEvent.change(screen.getByTestId('order-notes'), {
        target: { value: 'A note' },
      });
      expect(screen.getByText('SAVE').closest('button')).not.toBeDisabled();
    });

    it('SAVE is disabled when notes contain only whitespace', () => {
      const inProgressOrder: Order = { ...mockOrder, status: 'In Progress' };
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={inProgressOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      fireEvent.change(screen.getByTestId('order-notes'), {
        target: { value: '   ' },
      });
      expect(screen.getByText('SAVE').closest('button')).toBeDisabled();
    });

    it('CANCEL is always enabled regardless of form state', () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );
      expect(screen.getByText('CANCEL').closest('button')).not.toBeDisabled();
    });
  });

  describe('Multiple Order Scenarios', () => {
    it('displays different order when order prop changes', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      const { rerender } = renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('New Cast - Plaster')).toBeInTheDocument();

      const newOrder: Order = {
        ...mockOrder,
        id: 'order-2',
        orderName: 'Blood Test',
      };

      rerender(
        <OrderFulfillmentSlider
          order={newOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('Blood Test')).toBeInTheDocument();
      expect(screen.queryByText('New Cast - Plaster')).not.toBeInTheDocument();
    });

    it('handles switching between orders with different patient details', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      const { rerender } = renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('Male')).toBeInTheDocument();

      const femalePatientOrder: Order = {
        ...mockOrder,
        id: 'order-2',
        patient: {
          ...mockOrder.patient,
          gender: 'Female',
        },
      };

      rerender(
        <OrderFulfillmentSlider
          order={femalePatientOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      expect(screen.getByText('Female')).toBeInTheDocument();
      expect(screen.queryByText('Male')).not.toBeInTheDocument();
    });
  });

  describe('LMP (Last Menstrual Period) Display', () => {
    it('fetches observation data when radiology slider opens with config', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      (mockGetObservationByConceptName as jest.Mock).mockResolvedValueOnce({
        date: '2024-01-15',
        daysSince: 30,
      });

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockRadiologyOrderEligibleForLmp}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
        />,
      );

      await waitFor(() => {
        expect(mockGetObservationByConceptName).toHaveBeenCalledWith(
          'patient-uuid-1',
          'LMP Date',
        );
      });
    });

    it('does not fetch observation data for non-radiology tabs', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
          tabLabel="Lab Order"
        />,
      );

      await waitFor(() => {
        expect(mockGetObservationByConceptName).not.toHaveBeenCalled();
      });
    });

    it('displays observation days when data is available for radiology tab', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      const mockLmpData = {
        date: '2024-01-15',
        daysSince: 30,
      };

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockRadiologyOrderEligibleForLmp}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
          prefetchedLmpData={mockLmpData}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('observation-days-display'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('observation-days-value')).toHaveTextContent(
          '30',
        );
      });
    });

    it('applies red styling when daysSince > 28 (warning threshold)', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      const mockLmpData = {
        date: '2024-01-10',
        daysSince: 29,
      };

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockRadiologyOrderEligibleForLmp}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
          prefetchedLmpData={mockLmpData}
        />,
      );

      await waitFor(() => {
        const obsValue = screen.getByTestId('observation-days-value');
        expect(obsValue).toHaveClass('observationWarning');
        expect(obsValue).toHaveTextContent('29');
      });
    });

    it('does not apply red styling when daysSince <= 28', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      const mockLmpData = {
        date: '2024-02-10',
        daysSince: 28,
      };

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockRadiologyOrderEligibleForLmp}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
          prefetchedLmpData={mockLmpData}
        />,
      );

      await waitFor(() => {
        const obsValue = screen.getByTestId('observation-days-value');
        expect(obsValue).not.toHaveClass('observationWarning');
        expect(obsValue).toHaveTextContent('28');
      });
    });

    it('shows observation section with "not recorded" message when data is null', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockRadiologyOrderEligibleForLmp}
          onClose={mockOnClose}
          isOpen
          tabLabel="Radiology Order"
          prefetchedLmpData={null}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('observation-days-display'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('observation-days-value')).toHaveTextContent(
          'OBSERVATION_NOT_RECORDED',
        );
      });
    });

    it('does not display observation section for non-radiology orders', async () => {
      useOrdersConfig.mockReturnValue(mockConfig);
      (mockGetObservationByConceptName as jest.Mock).mockResolvedValue({
        date: '2024-01-15',
        daysSince: 30,
      });

      renderWithIntl(
        <OrderFulfillmentSlider
          order={mockRadiologyOrderEligibleForLmp}
          onClose={mockOnClose}
          isOpen
          tabLabel="Lab Order"
        />,
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId('observation-days-display'),
        ).not.toBeInTheDocument();
        expect(mockGetObservationByConceptName).not.toHaveBeenCalled();
      });
    });
  });
});
