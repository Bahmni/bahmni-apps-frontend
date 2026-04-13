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
});
