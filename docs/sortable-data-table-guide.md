# SortableDataTable – Developer Documentation

## Overview

The `SortableDataTable` is a reusable and configurable React component used across the Bahmni Clinical Frontend. It is based on the Carbon Design System's DataTable and provides consistent, accessible, and sortable tabular views for various clinical data types (e.g., medications, allergies, encounters).

---

## Features

- ✅ Column-level sorting
- ✅ Loading state with Carbon skeletons
- ✅ Empty and error state handling
- ✅ Customizable cell rendering
- ✅ Screen reader and keyboard accessibility
- ✅ Styling and layout extensibility

---

## Installation & Usage

```tsx
import { SortableDataTable } from "@components/common/sortableDataTable/SortableDataTable";
```

Use the component in a clinical view by providing column headers, data rows, and optionally, a `renderCell` function for custom rendering.

---

## Props Reference

### Generic Signature

```ts
function SortableDataTable<T>(props: SortableDataTableProps<T>): JSX.Element;
```

### Props Table

| Prop                | Type                                       | Required | Description                                                |
| ------------------- | ------------------------------------------ | -------- | ---------------------------------------------------------- |
| `headers`           | `DataTableHeader[]`                        | ✅       | Defines the columns (key & display header).                |
| `rows`              | `T[]`                                      | ✅       | Data to be displayed.                                      |
| `ariaLabel`         | `string`                                   | ✅       | ARIA label for accessibility.                              |
| `renderCell`        | `(row: T, key: string) => React.ReactNode` | ❌       | Custom cell rendering logic per column.                    |
| `sortable`          | `{ key: string; sortable: boolean }[]`     | ❌       | Controls per-column sortability. Defaults to all sortable. |
| `loading`           | `boolean`                                  | ❌       | Enables skeleton loading view.                             |
| `emptyStateMessage` | `string`                                   | ❌       | Fallback text when `rows` is empty.                        |
| `errorStateMessage` | `string`                                   | ❌       | Error message shown on failure.                            |
| `className`         | `string`                                   | ❌       | Additional CSS classes for wrapper.                        |

---

## Type Definitions

```ts
interface DataTableHeader {
  key: string;
  header: string;
}

interface SortableColumn {
  key: string;
  sortable: boolean;
}

interface SortableDataTableProps<T> {
  headers: DataTableHeader[];
  rows: T[];
  renderCell?: (row: T, key: string) => React.ReactNode;
  sortable?: SortableColumn[];
  ariaLabel: string;
  loading?: boolean;
  errorStateMessage?: string;
  emptyStateMessage?: string;
  className?: string;
}
```

---

## States & Behavior

| State       | Trigger Condition               | Description                                       |
| ----------- | ------------------------------- | ------------------------------------------------- |
| **Loading** | `loading={true}`                | Shows Carbon skeleton rows.                       |
| **Empty**   | `rows` is empty array           | Displays `emptyStateMessage` or default fallback. |
| **Error**   | `errorStateMessage` is provided | Displays formatted error message.                 |
| **Default** | `rows.length > 0`               | Displays sortable data table with content.        |

---

## Sorting Behavior

- **Default**: All columns are sortable.
- **Custom**: Provide `sortable` array to enable/disable specific columns.
- **Invalid Keys**: Columns not listed in `headers` are ignored in `sortable`.

Example:

```tsx
<SortableDataTable
  headers={[
    { key: "name", header: "Name" },
    { key: "status", header: "Status" },
  ]}
  rows={data}
  sortable={[
    { key: "name", sortable: true },
    { key: "status", sortable: false },
  ]}
  ariaLabel="Data Table"
  renderCell={(row, key) => row[key]}
/>
```

---

## Custom Rendering

Use the `renderCell` function for context-aware formatting:

```tsx
const renderCell = (row: Medication, key: string) => {
  switch (key) {
    case "status":
      return (
        <Tag type={row.status === "active" ? "green" : "gray"}>
          {row.status}
        </Tag>
      );
    case "orderDate":
      return new Date(row.orderDate).toLocaleDateString();
    default:
      return row[key] ?? "—";
  }
};
```

---

## Example Usage

### Medication Table

```tsx
<SortableDataTable
  headers={[
    { key: "name", header: "Medication" },
    { key: "status", header: "Status" },
    { key: "orderedBy", header: "Prescriber" },
    { key: "orderDate", header: "Date Ordered" },
  ]}
  rows={medications}
  ariaLabel="Medication Orders Table"
  renderCell={renderCell}
/>
```

### Encounter History (non-sortable)

```tsx
<SortableDataTable
  headers={[
    { key: "encounterType", header: "Type" },
    { key: "provider", header: "Provider" },
    { key: "date", header: "Date" },
  ]}
  rows={encounters}
  sortable={[
    { key: "encounterType", sortable: false },
    { key: "provider", sortable: false },
    { key: "date", sortable: true },
  ]}
  ariaLabel="Encounter History"
/>
```

---

## Styling

Pass a `className` for wrapper-level styling:

```tsx
<SortableDataTable
  headers={headers}
  rows={data}
  className="highlight-table"
  ariaLabel="Custom Styled Table"
/>
```

You may also customize cell rendering with custom CSS classes using `renderCell`.

---

## Testing Guidelines

Use React Testing Library:

```tsx
test("renders rows and headers correctly", () => {
  render(
    <SortableDataTable
      headers={headers}
      rows={mockData}
      ariaLabel="Test Table"
    />,
  );
  expect(screen.getByText("Paracetamol 650 mg")).toBeInTheDocument();
});
```

To test sorting, simulate click events on the column headers.

---

## Troubleshooting

| Issue                      | Cause                                        | Suggested Fix                                      |
| -------------------------- | -------------------------------------------- | -------------------------------------------------- |
| Text not found in test     | Multiple matching elements                   | Use `getAllByText()` or `within()` on scoped rows  |
| Sorting not working        | `sortable` prop missing or misconfigured     | Ensure `sortable.key` matches a valid header `key` |
| `[object Object]` in cells | Missing `renderCell` for complex/nested data | Use a custom `renderCell` function                 |
| No empty state shown       | `rows` is `undefined`                        | Ensure `rows` is at least an empty array           |

---

## Accessibility

- `ariaLabel` is required for table semantics.
- Sorting is implemented using Carbon’s accessible header buttons.
- Use semantic HTML and ARIA roles in `renderCell`.

---

## Design System Integration

Follows [Carbon Design System](https://carbondesignsystem.com/) guidelines for:

- Table styling
- Sort indicators
- Tag usage
- Skeleton loading states

---

## Recommendations

- Memoize `renderCell` with `useCallback` for performance in large tables.
- Format dates and numbers consistently using utility functions.
- Provide fallback content (`'—'` or `'N/A'`) for missing values.
- Use `Tag`, `Tooltip`, or icons for clarity in clinical data.

---

## Related Components

- [`DataTableHeader`](https://carbondesignsystem.com/components/data-table/usage/) – Carbon header definitions.
