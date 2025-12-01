import { getIdentifierTypes } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import {
  AdditionalIdentifiers,
  AdditionalIdentifiersRef,
} from '../AdditionalIdentifiers';

jest.mock('@bahmni/services', () => ({
  getIdentifierTypes: jest.fn(),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockIdentifierTypes = [
  {
    uuid: 'primary-id-uuid',
    name: 'Patient ID',
    description: 'Primary patient identifier',
    format: null,
    required: true,
    primary: true,
    identifierSources: [],
  },
  {
    uuid: 'national-id-uuid',
    name: 'National ID',
    description: 'National identification number',
    format: null,
    required: false,
    primary: false,
    identifierSources: [],
  },
  {
    uuid: 'passport-uuid',
    name: 'Passport Number',
    description: 'Passport identification',
    format: null,
    required: false,
    primary: false,
    identifierSources: [],
  },
];

describe('AdditionalIdentifiers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should not render when loading', () => {
    (getIdentifierTypes as jest.Mock).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { container } = render(<AdditionalIdentifiers />, { wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('should not render when there are no extra identifiers (only primary)', async () => {
    const primaryOnlyTypes = [mockIdentifierTypes[0]]; // Only primary identifier
    (getIdentifierTypes as jest.Mock).mockResolvedValue(primaryOnlyTypes);

    const { container } = render(<AdditionalIdentifiers />, { wrapper });

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render extra identifiers (non-primary) only', async () => {
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    render(<AdditionalIdentifiers />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('National ID')).toBeInTheDocument();
    });

    // Should render the two non-primary identifiers (as labels and inputs)
    expect(screen.getByText('National ID')).toBeInTheDocument();
    expect(screen.getByText('Passport Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('National ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Passport Number')).toBeInTheDocument();

    // Should NOT render the primary identifier
    expect(screen.queryByText('Patient ID')).not.toBeInTheDocument();
  });

  it('should handle user input for additional identifiers', async () => {
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);
    const user = userEvent.setup();

    render(<AdditionalIdentifiers />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('National ID')).toBeInTheDocument();
    });

    const nationalIdInput = screen.getByPlaceholderText('National ID');
    const passportInput = screen.getByPlaceholderText('Passport Number');

    await user.type(nationalIdInput, '123456789');
    await user.type(passportInput, 'AB123456');

    expect(nationalIdInput).toHaveValue('123456789');
    expect(passportInput).toHaveValue('AB123456');
  });

  it('should expose getData method via ref', async () => {
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);
    const ref = createRef<AdditionalIdentifiersRef>();
    const user = userEvent.setup();

    render(<AdditionalIdentifiers ref={ref} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('National ID')).toBeInTheDocument();
    });

    const nationalIdInput = screen.getByPlaceholderText('National ID');
    await user.type(nationalIdInput, '987654321');

    const data = ref.current?.getData();
    expect(data).toEqual({
      'national-id-uuid': '987654321',
      'passport-uuid': '',
    });
  });

  it('should expose validate method via ref (always returns true)', async () => {
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);
    const ref = createRef<AdditionalIdentifiersRef>();

    render(<AdditionalIdentifiers ref={ref} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('National ID')).toBeInTheDocument();
    });

    const isValid = ref.current?.validate();
    expect(isValid).toBe(true);
  });

  it('should populate initial data when provided', async () => {
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const initialData = {
      'national-id-uuid': 'INITIAL123',
      'passport-uuid': 'PASS999',
    };

    render(<AdditionalIdentifiers initialData={initialData} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('National ID')).toBeInTheDocument();
    });

    const nationalIdInput = screen.getByPlaceholderText('National ID');
    const passportInput = screen.getByPlaceholderText('Passport Number');

    expect(nationalIdInput).toHaveValue('INITIAL123');
    expect(passportInput).toHaveValue('PASS999');
  });

  it('should handle error when fetching identifier types fails', async () => {
    (getIdentifierTypes as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch'),
    );

    const { container } = render(<AdditionalIdentifiers />, { wrapper });

    await waitFor(() => {
      // Should not render when there's an error
      expect(container.firstChild).toBeNull();
    });
  });
});
