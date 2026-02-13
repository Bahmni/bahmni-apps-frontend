import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useOrdersConfig } from '../../../hooks/useOrdersConfig';
import { Order } from '../../../models/orderFulfillment';
import { OrderFulfillmentSlider } from '../OrderFulfillmentSlider';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../hooks/useOrdersConfig', () => ({
  useOrdersConfig: jest.fn(),
}));

jest.mock('react-intl', () => ({
  FormattedMessage: ({
    id,
    defaultMessage,
  }: {
    id: string;
    defaultMessage: string;
  }) => <span>{defaultMessage || id}</span>,
}));

const mockOrder: Order = {
  id: 'order-1',
  orderName: 'New Cast - Plaster',
  orderType: 'Rehab Order',
  priority: 'Urgent',
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

describe('OrderFulfillmentSlider', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
        'New',
        'In Progress',
        'Acknowledged',
        'Completed',
      ],
      orderStatusesPreSelected: ['New', 'In Progress'],
    },
  };

  it('renders nothing when isOpen is false', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    const { container } = render(
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

    const { container } = render(
      <OrderFulfillmentSlider order={null} onClose={mockOnClose} isOpen />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders slider with order name', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    render(
      <OrderFulfillmentSlider order={mockOrder} onClose={mockOnClose} isOpen />,
    );

    expect(screen.getByText('New Cast - Plaster')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    render(
      <OrderFulfillmentSlider order={mockOrder} onClose={mockOnClose} isOpen />,
    );

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    useOrdersConfig.mockReturnValue(mockConfig);

    render(
      <OrderFulfillmentSlider order={mockOrder} onClose={mockOnClose} isOpen />,
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('Patient Details', () => {
    it('renders patient details from config', () => {
      useOrdersConfig.mockReturnValue(mockConfig);

      render(
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
          orderStatusesAvailable: ['New', 'In Progress'],
          orderStatusesPreSelected: ['New'],
        },
      });

      render(
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

      render(
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
          orderStatusesAvailable: ['New', 'In Progress'],
          orderStatusesPreSelected: ['New'],
        },
      });

      render(
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
          orderStatusesAvailable: ['New', 'In Progress'],
          orderStatusesPreSelected: ['New'],
        },
      });

      render(
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

      render(
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

      render(
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

      render(
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

      render(
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

      render(
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

      render(
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

      render(
        <OrderFulfillmentSlider
          order={mockOrder}
          onClose={mockOnClose}
          isOpen
        />,
      );

      const saveButton = screen.getByText('Save');
      const cancelButton = screen.getByText('Cancel');
      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });
});
