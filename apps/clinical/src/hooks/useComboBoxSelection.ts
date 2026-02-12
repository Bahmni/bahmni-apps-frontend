import { useCallback, useState } from 'react';

/**
 * A custom React hook for managing ComboBox selection state with automatic reset.
 *
 * This hook manages the visual display of a selected item in a ComboBox,
 * automatically clearing it after rendering. This is useful for showing
 * a "flash" effect when an item is selected before clearing the input field.
 *
 * Implementation details:
 * - Uses queueMicrotask() for predictable next-tick execution
 * - Microtasks run after synchronous code but before browser repaints
 * - Ensures the selected item renders visually before being cleared
 * - More deterministic than setTimeout (no timing dependency)
 *
 * Common use cases include:
 * - Medication/Vaccination search forms
 * - Allergy selection forms
 * - Condition/Diagnosis selection forms
 * - Any ComboBox that needs to clear selection after adding an item
 *
 * @template T - The type of the selected item
 * @returns An object containing:
 *   - selectedItem: The currently selected item (or null when cleared)
 *   - resetSelection: Function to set an item and schedule its reset via queueMicrotask
 *
 * @example
 * const { selectedItem, resetSelection } = useComboBoxSelection<MyType>();
 *
 * const handleItemSelect = (item: MyType) => {
 *   addItem(item);
 *   resetSelection(item);
 * };
 */
function useComboBoxSelection<T>() {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const resetSelection = useCallback((item: T) => {
    setSelectedItem(item);
    // Use queueMicrotask for predictable next-tick execution.
    // Microtasks run after all synchronous code but before browser repaints,
    // ensuring the component renders with the selected item visible before clearing.
    queueMicrotask(() => setSelectedItem(null));
  }, []);

  return { selectedItem, resetSelection };
}

export default useComboBoxSelection;
