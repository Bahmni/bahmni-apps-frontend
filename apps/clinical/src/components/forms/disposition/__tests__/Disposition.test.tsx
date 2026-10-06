import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import {
  fetchDispositionTypes,
  filterDispositionTypesByAdmissionStatus,
} from '../../../../services/dispositionService';
import { useDispositionStore } from '../../../../stores/dispositionStore';
import Disposition from '../Disposition';
import '@testing-library/jest-dom';

let capturedDropdownProps: any = null;
let capturedDatePickerOnChange: ((dates: Date[]) => void) | null = null;

jest.mock('../../../../services/dispositionService', () => ({
  fetchDispositionTypes: jest.fn(),
  fetchAdmissionStatus: jest.fn(),
  filterDispositionTypesByAdmissionStatus: jest.fn((types) => types),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  usePatientUUID: jest.fn().mockReturnValue(null),
}));

const mockedFetchDispositionTypes =
  fetchDispositionTypes as jest.MockedFunction<typeof fetchDispositionTypes>;
const mockedFilterDispositionTypesByAdmissionStatus =
  filterDispositionTypesByAdmissionStatus as jest.MockedFunction<
    typeof filterDispositionTypesByAdmissionStatus
  >;

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  return {
    ...actual,
    Dropdown: jest.fn((props: any) => {
      capturedDropdownProps = props;
      return (
        <div data-testid={props['data-testid']}>
          {props.items.map((item: any) => (
            <button
              key={item.value}
              type="button"
              onClick={() => props.onChange({ selectedItem: item })}
            >
              {item.label}
            </button>
          ))}
        </div>
      );
    }),
    DatePicker: jest.fn((props: any) => {
      capturedDatePickerOnChange = props.onChange;
      return <div data-testid="disposition-date-picker">{props.children}</div>;
    }),
    DatePickerInput: jest.fn(() => (
      <input data-testid="disposition-date-input" />
    )),
  };
});

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(() => ({ t: (key: string) => key })),
}));

// Prevent SCSS module resolution errors in jsdom
jest.mock('../styles/Disposition.module.scss', () => ({}), { virtual: true });

const FETCHED_DISPOSITION_TYPES = [
  { value: 'ADMIT', label: 'Admit', conceptUuid: 'admit-uuid' },
  { value: 'DISCHARGE', label: 'Discharge', conceptUuid: 'discharge-uuid' },
  { value: 'TRANSFER', label: 'Transfer', conceptUuid: 'transfer-uuid' },
];

describe('Disposition', () => {
  beforeEach(() => {
    act(() => {
      useDispositionStore.getState().setTypeRequired(true);
      useDispositionStore.getState().reset();
    });
    capturedDropdownProps = null;
    capturedDatePickerOnChange = null;
    mockedFetchDispositionTypes.mockResolvedValue(FETCHED_DISPOSITION_TYPES);
    mockedFilterDispositionTypesByAdmissionStatus.mockClear();
    mockedFilterDispositionTypesByAdmissionStatus.mockImplementation(
      (types) => types,
    );
  });

  it('filters disposition types by the visit admission status', async () => {
    mockedFilterDispositionTypesByAdmissionStatus.mockReturnValue([
      FETCHED_DISPOSITION_TYPES[0],
    ]);

    renderWithQueryClient(<Disposition />);

    await waitFor(() =>
      expect(
        mockedFilterDispositionTypesByAdmissionStatus,
      ).toHaveBeenCalledWith(FETCHED_DISPOSITION_TYPES, null),
    );
  });

  it('renders the form title, type dropdown, date picker and notes textarea', async () => {
    renderWithQueryClient(<Disposition />);

    await waitFor(() =>
      expect(capturedDropdownProps.items).toEqual(FETCHED_DISPOSITION_TYPES),
    );
    expect(screen.getByTestId('disposition-tile')).toBeInTheDocument();
    expect(screen.getByTestId('disposition-form-title')).toHaveTextContent(
      'DISPOSITION_FORM_TITLE',
    );
    expect(screen.getByTestId('disposition-type-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('disposition-date-picker')).toBeInTheDocument();
    expect(document.getElementById('disposition-notes')).toBeInTheDocument();
  });

  it('renders fetched disposition type options when the concept fetch succeeds', async () => {
    renderWithQueryClient(<Disposition />);

    await waitFor(() =>
      expect(capturedDropdownProps.items).toEqual(FETCHED_DISPOSITION_TYPES),
    );
  });

  it('falls back to config-provided dropdown options when the fetch returns nothing', async () => {
    mockedFetchDispositionTypes.mockResolvedValue([]);
    const inputControlConfig = {
      type: 'disposition',
      metadata: {
        dispositionTypes: [{ value: 'ADMIT', label: 'Admit Custom' }],
      },
      encounterTypes: [],
      privileges: [],
      attributes: [],
    };

    renderWithQueryClient(
      <Disposition inputControlConfig={inputControlConfig as any} />,
    );

    await waitFor(() =>
      expect(capturedDropdownProps.items).toEqual([
        { value: 'ADMIT', label: 'Admit Custom' },
      ]),
    );
  });

  it('selecting a type updates the store and clears the validation error', async () => {
    renderWithQueryClient(<Disposition />);

    act(() => {
      useDispositionStore.getState().validate();
    });
    expect(useDispositionStore.getState().errors.type).toBe(
      'DROPDOWN_VALUE_REQUIRED',
    );

    await waitFor(() => expect(screen.getByText('Admit')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Admit'));

    expect(useDispositionStore.getState().selectedType).toEqual(
      FETCHED_DISPOSITION_TYPES[0],
    );
    expect(useDispositionStore.getState().errors.type).toBeUndefined();
  });

  it('marks type as required by default when config has no "type" attribute entry', async () => {
    renderWithQueryClient(<Disposition />);

    await waitFor(() =>
      expect(useDispositionStore.getState().isTypeRequired).toBe(true),
    );
  });

  it('is driven by the standard-config attributes entry for "type"', async () => {
    const inputControlConfig = {
      type: 'disposition',
      metadata: {},
      encounterTypes: [],
      privileges: [],
      attributes: [{ name: 'type', required: false }],
    };

    renderWithQueryClient(
      <Disposition inputControlConfig={inputControlConfig as any} />,
    );

    await waitFor(() =>
      expect(useDispositionStore.getState().isTypeRequired).toBe(false),
    );
  });

  it('auto-selects the current date by default', async () => {
    renderWithQueryClient(<Disposition />);

    await waitFor(() =>
      expect(useDispositionStore.getState().date).not.toBeNull(),
    );
  });

  it('selecting a date updates the store', async () => {
    renderWithQueryClient(<Disposition />);

    await waitFor(() =>
      expect(screen.getByTestId('disposition-date-picker')).toBeInTheDocument(),
    );

    const date = new Date('2026-09-29');
    act(() => {
      capturedDatePickerOnChange?.([date]);
    });

    expect(useDispositionStore.getState().date).toEqual(date);
  });

  it('typing notes updates the live character counter up to the configured max', async () => {
    renderWithQueryClient(<Disposition />);

    await waitFor(() =>
      expect(document.getElementById('disposition-notes')).toBeInTheDocument(),
    );
    const input = document.getElementById(
      'disposition-notes',
    ) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: 'hello world' } });

    expect(useDispositionStore.getState().notes).toBe('hello world');
  });

  it('does not update notes beyond the configured max length', async () => {
    const inputControlConfig = {
      type: 'disposition',
      metadata: { notesMaxLength: 5 },
      encounterTypes: [],
      privileges: [],
      attributes: [],
    };
    renderWithQueryClient(
      <Disposition inputControlConfig={inputControlConfig as any} />,
    );

    await waitFor(() =>
      expect(document.getElementById('disposition-notes')).toBeInTheDocument(),
    );
    const input = document.getElementById(
      'disposition-notes',
    ) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: 'toolong' } });

    expect(useDispositionStore.getState().notes).toBe('');
  });

  it('hides the date picker when showDatePicker metadata is false', async () => {
    const inputControlConfig = {
      type: 'disposition',
      metadata: { showDatePicker: false },
      encounterTypes: [],
      privileges: [],
      attributes: [],
    };
    renderWithQueryClient(
      <Disposition inputControlConfig={inputControlConfig as any} />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId('disposition-type-dropdown'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByTestId('disposition-date-picker'),
    ).not.toBeInTheDocument();
  });
});
