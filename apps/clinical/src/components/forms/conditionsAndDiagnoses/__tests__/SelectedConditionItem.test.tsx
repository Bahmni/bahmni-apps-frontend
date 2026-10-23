import { type ConditionInputEntry } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React, { useState } from 'react';
import i18n from '../../../../../setupTests.i18n';
import { type ConditionDurationField } from '../../../../constants/conditions';
import SelectedConditionItem, {
  SelectedConditionItemProps,
} from '../SelectedConditionItem';

expect.extend(toHaveNoViolations);

// Mock Carbon Design System components
jest.mock('@bahmni/design-system', () => ({
  Column: ({ children, className, ...props }: any) => (
    <div data-testid="carbon-column" className={className} {...props}>
      {children}
    </div>
  ),

  Grid: ({ children, ...props }: any) => (
    <div data-testid="carbon-grid" {...props}>
      {children}
    </div>
  ),
  TextInput: ({
    id,
    labelText,
    value,
    onChange,
    type,
    className,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    size,
    'data-testid': dataTestId,
    ...props
  }: any) => (
    <div className={className}>
      <label htmlFor={id}>{labelText}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        data-testid={dataTestId}
        {...props}
      />
    </div>
  ),
}));

const FIELDS: ConditionDurationField[] = ['years', 'months', 'days'];

describe('SelectedConditionItem', () => {
  const mockUpdateConditionDuration = jest.fn();

  const createCondition = (
    overrides: Partial<ConditionInputEntry> = {},
  ): ConditionInputEntry => ({
    id: 'test-condition-1',
    display: 'Test Condition Name',
    durationYears: null,
    durationMonths: null,
    durationDays: null,
    errors: {},
    hasBeenValidated: false,
    ...overrides,
  });

  const renderItem = (props: Partial<SelectedConditionItemProps> = {}) =>
    render(
      <SelectedConditionItem
        condition={createCondition()}
        updateConditionDuration={mockUpdateConditionDuration}
        {...props}
      />,
    );

  const getInput = (field: ConditionDurationField, id = 'test-condition-1') =>
    screen.getByTestId(`condition-duration-${field}-${id}`) as HTMLInputElement;

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
  });

  describe('Rendering', () => {
    test('renders condition name and three labelled duration inputs', () => {
      renderItem();

      expect(screen.getByText('Test Condition Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Years')).toBe(getInput('years'));
      expect(screen.getByLabelText('Months')).toBe(getInput('months'));
      expect(screen.getByLabelText('Days')).toBe(getInput('days'));
    });

    test('renders the duration group with a translated legend', () => {
      renderItem();

      const group = screen.getByRole('group');
      expect(group).toHaveAccessibleName(
        'Test Condition Name Duration since onset',
      );
      expect(screen.getByText('Duration since onset')).toBeInTheDocument();
    });

    test('renders inputs as numeric text inputs', () => {
      renderItem();

      FIELDS.forEach((field) => {
        const input = getInput(field);
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('inputMode', 'numeric');
      });
    });

    test('displays values from the condition', () => {
      renderItem({
        condition: createCondition({
          durationYears: 1,
          durationMonths: 6,
          durationDays: 10,
        }),
      });

      expect(getInput('years')).toHaveValue('1');
      expect(getInput('months')).toHaveValue('6');
      expect(getInput('days')).toHaveValue('10');
    });

    test('displays empty inputs when values are null', () => {
      renderItem();

      FIELDS.forEach((field) => expect(getInput(field)).toHaveValue(''));
    });

    test('displays zero values', () => {
      renderItem({ condition: createCondition({ durationMonths: 0 }) });

      expect(getInput('months')).toHaveValue('0');
    });
  });

  describe('Valid input', () => {
    test.each([
      ['years', '2', 2],
      ['months', '18', 18],
      ['days', '10', 10],
      ['years', '0', 0],
      ['years', '150', 150],
      ['months', '999', 999],
      ['days', '999', 999],
      ['days', ' 7 ', 7],
    ] as [ConditionDurationField, string, number][])(
      'commits %s value "%s" as %d',
      (field, rawValue, expected) => {
        renderItem();

        fireEvent.change(getInput(field), { target: { value: rawValue } });

        expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
          'test-condition-1',
          field,
          expected,
        );
      },
    );

    test('commits null when an input is cleared', () => {
      renderItem({ condition: createCondition({ durationYears: 2 }) });

      fireEvent.change(getInput('years'), { target: { value: '' } });

      expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
        'test-condition-1',
        'years',
        null,
      );
    });
  });

  describe('Invalid input', () => {
    test.each([
      ['years', '-3'],
      ['years', '2.4'],
      ['years', 'abc'],
      ['years', '1e2'],
      ['years', '151'],
      ['months', '1000'],
      ['days', '1000'],
      ['months', '-1'],
      ['days', '3.5'],
    ] as [ConditionDurationField, string][])(
      'rejects %s value "%s" and keeps sibling values',
      (field, rawValue) => {
        renderItem({
          condition: createCondition({
            durationYears: 1,
            durationMonths: 6,
            durationDays: 10,
          }),
        });

        fireEvent.change(getInput(field), { target: { value: rawValue } });

        expect(mockUpdateConditionDuration).not.toHaveBeenCalled();
        expect(getInput('years')).toHaveValue('1');
        expect(getInput('months')).toHaveValue('6');
        expect(getInput('days')).toHaveValue('10');
      },
    );

    test('ignores invalid keystrokes while typing', async () => {
      const user = userEvent.setup();
      const updates: Array<[string, ConditionDurationField, number | null]> =
        [];

      const StatefulItem = () => {
        const [condition, setCondition] = useState(createCondition());
        return (
          <SelectedConditionItem
            condition={condition}
            updateConditionDuration={(id, field, value) => {
              updates.push([id, field, value]);
              const key = {
                years: 'durationYears',
                months: 'durationMonths',
                days: 'durationDays',
              }[field];
              setCondition((prev) => ({ ...prev, [key]: value }));
            }}
          />
        );
      };
      render(<StatefulItem />);

      await user.type(getInput('years'), '2.4');
      await user.type(getInput('months'), 'x6');

      expect(getInput('years')).toHaveValue('24');
      expect(getInput('months')).toHaveValue('6');
      expect(getInput('days')).toHaveValue('');
      expect(updates.every(([, , value]) => Number.isInteger(value))).toBe(
        true,
      );
    });
  });

  describe('Validation errors', () => {
    const conditionWithError = createCondition({
      errors: { duration: 'CONDITIONS_DURATION_REQUIRED' },
      hasBeenValidated: true,
    });

    test('does not show error before validation', () => {
      renderItem({
        condition: createCondition({
          errors: { duration: 'CONDITIONS_DURATION_REQUIRED' },
          hasBeenValidated: false,
        }),
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      FIELDS.forEach((field) =>
        expect(getInput(field)).toHaveAttribute('aria-invalid', 'false'),
      );
    });

    test('shows a single translated error after validation', () => {
      renderItem({ condition: conditionWithError });

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent(
        'Enter duration in years, months or days',
      );
      expect(
        screen.queryByText('CONDITIONS_DURATION_REQUIRED'),
      ).not.toBeInTheDocument();
    });

    test('marks every input invalid and describes it with the error', () => {
      renderItem({ condition: conditionWithError });

      const errorId = 'condition-duration-error-test-condition-1';
      expect(screen.getByRole('alert')).toHaveAttribute('id', errorId);
      FIELDS.forEach((field) => {
        const input = getInput(field);
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', errorId);
        expect(input).toHaveAccessibleDescription(
          'Enter duration in years, months or days',
        );
      });
    });

    test('shows translated error in another language', async () => {
      await i18n.changeLanguage('es');
      i18n.addResourceBundle(
        'es',
        'clinical',
        { CONDITIONS_DURATION_REQUIRED: 'Ingrese la duración' },
        true,
        true,
      );

      renderItem({ condition: conditionWithError });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ingrese la duración',
      );
    });

    test('clears error when condition no longer has an error', () => {
      const { rerender } = renderItem({ condition: conditionWithError });
      expect(screen.getByRole('alert')).toBeInTheDocument();

      rerender(
        <SelectedConditionItem
          condition={{ ...conditionWithError, durationYears: 2, errors: {} }}
          updateConditionDuration={mockUpdateConditionDuration}
        />,
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(getInput('years')).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Keyboard navigation', () => {
    test('focus moves Years → Months → Days', async () => {
      const user = userEvent.setup();
      renderItem();

      await user.tab();
      expect(getInput('years')).toHaveFocus();
      await user.tab();
      expect(getInput('months')).toHaveFocus();
      await user.tab();
      expect(getInput('days')).toHaveFocus();
    });
  });

  describe('Multiple rows', () => {
    test('renders independent inputs per condition', () => {
      render(
        <>
          <SelectedConditionItem
            condition={createCondition({ id: 'c1', durationYears: 2 })}
            updateConditionDuration={mockUpdateConditionDuration}
          />
          <SelectedConditionItem
            condition={createCondition({ id: 'c2', durationDays: 5 })}
            updateConditionDuration={mockUpdateConditionDuration}
          />
        </>,
      );

      expect(getInput('years', 'c1')).toHaveValue('2');
      expect(getInput('days', 'c1')).toHaveValue('');
      expect(getInput('years', 'c2')).toHaveValue('');
      expect(getInput('days', 'c2')).toHaveValue('5');

      fireEvent.change(getInput('months', 'c2'), { target: { value: '3' } });
      expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
        'c2',
        'months',
        3,
      );
      expect(mockUpdateConditionDuration).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memoization', () => {
    test('is wrapped in React.memo', () => {
      expect(SelectedConditionItem.displayName).toBe('SelectedConditionItem');
      expect((SelectedConditionItem as any).$$typeof).toBe(
        Symbol.for('react.memo'),
      );
    });
  });

  describe('Accessibility', () => {
    test('has no axe violations', async () => {
      const { container } = renderItem();
      expect(await axe(container)).toHaveNoViolations();
    });

    test('has no axe violations when showing an error', async () => {
      const { container } = renderItem({
        condition: createCondition({
          errors: { duration: 'CONDITIONS_DURATION_REQUIRED' },
          hasBeenValidated: true,
        }),
      });
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
