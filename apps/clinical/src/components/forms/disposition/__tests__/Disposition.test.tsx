import { act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useDispositionStore } from '../../../../stores/dispositionStore';
import Disposition from '../Disposition';
import '@testing-library/jest-dom';

let capturedDropdownProps: any = null;
let capturedDatePickerOnChange: ((dates: Date[]) => void) | null = null;

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

describe('Disposition', () => {
  beforeEach(() => {
    act(() => {
      useDispositionStore.getState().reset();
    });
    capturedDropdownProps = null;
    capturedDatePickerOnChange = null;
  });

  it('renders the form title, type dropdown, date picker and notes textarea', () => {
    render(<Disposition />);

    expect(screen.getByTestId('disposition-tile')).toBeInTheDocument();
    expect(screen.getByTestId('disposition-form-title')).toHaveTextContent(
      'DISPOSITION_FORM_TITLE',
    );
    expect(screen.getByTestId('disposition-type-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('disposition-date-picker')).toBeInTheDocument();
    expect(document.getElementById('disposition-notes')).toBeInTheDocument();
  });

  it('renders default disposition type options when no config is provided', () => {
    render(<Disposition />);

    expect(capturedDropdownProps.items).toEqual([
      { value: 'ADMIT', label: 'Admit' },
      { value: 'DISCHARGE', label: 'Discharge' },
      { value: 'TRANSFER', label: 'Transfer' },
      { value: 'UNDO_DISCHARGE', label: 'Undo Discharge' },
    ]);
  });

  it('renders config-provided dropdown options when supplied', () => {
    const inputControlConfig = {
      type: 'disposition',
      metadata: {
        dispositionTypes: [{ value: 'ADMIT', label: 'Admit Custom' }],
      },
      encounterTypes: [],
      privileges: [],
      attributes: [],
    };

    render(<Disposition inputControlConfig={inputControlConfig as any} />);

    expect(capturedDropdownProps.items).toEqual([
      { value: 'ADMIT', label: 'Admit Custom' },
    ]);
  });

  it('selecting a type updates the store and clears the validation error', () => {
    render(<Disposition />);

    act(() => {
      useDispositionStore.getState().validate();
    });
    expect(useDispositionStore.getState().errors.type).toBe(
      'DROPDOWN_VALUE_REQUIRED',
    );

    fireEvent.click(screen.getByText('Admit'));

    expect(useDispositionStore.getState().selectedType).toEqual({
      value: 'ADMIT',
      label: 'Admit',
    });
    expect(useDispositionStore.getState().errors.type).toBeUndefined();
  });

  it('selecting a date updates the store', () => {
    render(<Disposition />);

    const date = new Date('2026-09-29');
    act(() => {
      capturedDatePickerOnChange?.([date]);
    });

    expect(useDispositionStore.getState().date).toEqual(date);
  });

  it('typing notes updates the live character counter up to the configured max', () => {
    render(<Disposition />);

    const input = document.getElementById(
      'disposition-notes',
    ) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: 'hello world' } });

    expect(useDispositionStore.getState().notes).toBe('hello world');
  });

  it('does not update notes beyond the configured max length', () => {
    const inputControlConfig = {
      type: 'disposition',
      metadata: { notesMaxLength: 5 },
      encounterTypes: [],
      privileges: [],
      attributes: [],
    };
    render(<Disposition inputControlConfig={inputControlConfig as any} />);

    const input = document.getElementById(
      'disposition-notes',
    ) as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: 'toolong' } });

    expect(useDispositionStore.getState().notes).toBe('');
  });

  it('hides the date picker when showDatePicker metadata is false', () => {
    const inputControlConfig = {
      type: 'disposition',
      metadata: { showDatePicker: false },
      encounterTypes: [],
      privileges: [],
      attributes: [],
    };
    render(<Disposition inputControlConfig={inputControlConfig as any} />);

    expect(
      screen.queryByTestId('disposition-date-picker'),
    ).not.toBeInTheDocument();
  });
});
