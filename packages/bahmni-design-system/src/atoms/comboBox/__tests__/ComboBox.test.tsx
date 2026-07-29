import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { ComboBox } from '..';

type Item = { label: string; value: string };

const items: Item[] = [
  { label: 'Hypertension', value: 'hypertension' },
  { label: 'Diabetes', value: 'diabetes' },
];

const defaultProps = {
  id: 'test-combobox',
  items,
  itemToString: (item: Item | null) => item?.label ?? '',
  onChange: jest.fn(),
};

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe('ComboBox', () => {
  describe('clearSelectedOnChange=false (default)', () => {
    it('should display the selected item in the input', () => {
      render(<ComboBox {...defaultProps} selectedItem={items[0]} />);

      expect(screen.getByRole('combobox')).toHaveValue('Hypertension');
    });

    it('should update display when selectedItem changes', () => {
      const { rerender } = render(
        <ComboBox {...defaultProps} selectedItem={items[0]} />,
      );

      rerender(<ComboBox {...defaultProps} selectedItem={items[1]} />);

      expect(screen.getByRole('combobox')).toHaveValue('Diabetes');
    });
  });

  describe('clearSelectedOnChange=true', () => {
    it('should clear the input after an item is selected', async () => {
      const { rerender } = render(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={null}
        />,
      );

      rerender(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={items[0]}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('');
      });
    });

    it('should clear input on each subsequent selection', async () => {
      const { rerender } = render(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={null}
        />,
      );

      rerender(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={items[0]}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('');
      });

      rerender(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          selectedItem={items[1]}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('');
      });
    });
  });

  describe('clearSelectedOnChange=true with user interaction', () => {
    it('should clear input after user clicks an item', async () => {
      const user = userEvent.setup();

      // Simulate real parent behaviour: update selectedItem in response to onChange
      const Wrapper = () => {
        const [selected, setSelected] = useState<Item | null>(null);
        return (
          <ComboBox
            {...defaultProps}
            clearSelectedOnChange
            selectedItem={selected}
            onChange={(e) => setSelected(e.selectedItem ?? null)}
          />
        );
      };

      render(<Wrapper />);

      await user.click(screen.getByRole('combobox'));
      await user.click(
        await screen.findByRole('option', { name: 'Hypertension' }),
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('');
      });
    });

    it('should clear input after user clicks an item without controlled selectedItem', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <ComboBox
          {...defaultProps}
          clearSelectedOnChange
          onChange={onChange}
        />,
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(
        await screen.findByRole('option', { name: 'Hypertension' }),
      );

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ selectedItem: items[0] }),
      );

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('');
      });
    });
  });

  describe('onChange forwarding', () => {
    it('should call onChange when an item is selected', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      render(
        <ComboBox {...defaultProps} onChange={onChange} selectedItem={null} />,
      );

      await user.click(screen.getByRole('combobox'));
      await user.click(
        await screen.findByRole('option', { name: 'Hypertension' }),
      );

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ selectedItem: items[0] }),
      );
    });
  });

  describe('handles selectedItem being a new object on every render', () => {
    it('should not call onChange when the selectedItem value stays the same', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <ComboBox
          {...defaultProps}
          onChange={onChange}
          selectedItem={{ ...items[0] }}
        />,
      );

      onChange.mockClear();

      rerender(
        <ComboBox
          {...defaultProps}
          onChange={onChange}
          selectedItem={{ ...items[0] }}
        />,
      );

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('combobox')).toHaveValue('Hypertension');
    });

    it('should allow editing the selected value by typing', async () => {
      const user = userEvent.setup();

      const Wrapper = () => {
        const [, forceRender] = useState(0);
        return (
          <ComboBox
            {...defaultProps}
            selectedItem={{ ...items[0] }}
            onInputChange={() => forceRender((n) => n + 1)}
          />
        );
      };

      render(<Wrapper />);

      const input = screen.getByRole('combobox');
      expect(input).toHaveValue('Hypertension');

      await user.clear(input);
      await user.type(input, 'Diabetes');

      expect(input).toHaveValue('Diabetes');
    });

    it('should keep the typed value after entering a custom value', async () => {
      const user = userEvent.setup();

      const Wrapper = () => {
        const [location, setLocation] = useState<Item | null>(null);

        const selectedItem = location
          ? { value: location.value, label: location.label }
          : null;

        return (
          <>
            <button type="button">outside</button>
            <ComboBox
              {...defaultProps}
              allowCustomValue
              selectedItem={selectedItem}
              onChange={({ selectedItem, inputValue }) => {
                if (
                  selectedItem &&
                  typeof selectedItem === 'object' &&
                  'value' in selectedItem
                ) {
                  setLocation({
                    value: (selectedItem as Item).value,
                    label: (selectedItem as Item).label,
                  });
                } else if (inputValue?.trim()) {
                  setLocation({ value: '', label: inputValue.trim() });
                } else {
                  setLocation(null);
                }
              }}
            />
          </>
        );
      };

      render(<Wrapper />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'Some Custom Location');
      await user.click(screen.getByRole('button', { name: 'outside' }));

      await waitFor(() => {
        expect(input).toHaveValue('Some Custom Location');
      });
    });
  });

  describe('clears the input on the first click', () => {
    it('should clear the input as soon as the clear button is clicked', async () => {
      const user = userEvent.setup();

      const Wrapper = () => {
        const [location, setLocation] = useState<Item | null>(null);

        const selectedItem = location
          ? { value: location.value, label: location.label }
          : null;

        return (
          <ComboBox
            {...defaultProps}
            allowCustomValue
            selectedItem={selectedItem}
            onChange={({ selectedItem, inputValue }) => {
              if (
                selectedItem &&
                typeof selectedItem === 'object' &&
                'value' in selectedItem
              ) {
                setLocation({
                  value: (selectedItem as Item).value,
                  label: (selectedItem as Item).label,
                });
              } else if (inputValue?.trim()) {
                setLocation({ value: '', label: inputValue.trim() });
              } else {
                setLocation(null);
              }
            }}
          />
        );
      };

      render(<Wrapper />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'New Location');
      await user.keyboard('{Backspace}');

      await user.click(
        screen.getByRole('button', { name: /clear selected item/i }),
      );

      expect(input).toHaveValue('');
    });
  });
});
