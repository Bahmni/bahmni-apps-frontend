# DataTable – Developer Documentation

## Overview

The `DataTable` is the unified table component in `@bahmni/design-system`. It is
TanStack-powered (for sort/filter/group/expand/pagination state) and
Carbon-rendered (for visual fidelity with the rest of the design system). It
covers everything `SortableDataTable`, `ExpandableDataTable`, `ActionDataTable`,
and `SimpleDataTable` do, plus column filtering, global search, grouping,
faceted unique values, and date-range filters.

For now it coexists with those four components; consumers migrate at their own
pace.

---

## Features

- ✅ Per-column sorting (single + shift-click for multi-column)
- ✅ Per-column filtering — text, multi-select (with faceted auto-options), date range
- ✅ Global search across all columns
- ✅ Grouping with collapsible group rows
- ✅ Row expansion with consumer-defined detail content
- ✅ Pagination (client + manual/server-side)
- ✅ Toolbar with title, description, and optional action button
- ✅ Loading / empty / error states
- ✅ Carbon Design System look + screen reader accessibility

---

## Installation & Usage

```tsx
import { DataTable, type DataTableColumn } from "@bahmni/design-system";
```

---

## Quick start

The minimum to render a table:

```tsx
interface Medication {
  id: string;
  name: string;
  status: string;
}

const columns: DataTableColumn<Medication>[] = [
  { key: "name", header: "Medication" },
  { key: "status", header: "Status" },
];

<DataTable
  columns={columns}
  rows={medications}
  ariaLabel="Medications"
/>
```

`id` is required on every row; `key` and `header` are the only required column
fields. Everything else is opt-in.

---

## Props Reference

### Core

| Prop                | Type                                       | Required | Description                                                |
| ------------------- | ------------------------------------------ | -------- | ---------------------------------------------------------- |
| `columns`           | `DataTableColumn<T>[]`                     | ✅       | Column definitions (see below).                            |
| `rows`              | `T[]` where `T extends { id: string }`     | ✅       | Data rows. Each row must have a stable `id`.               |
| `ariaLabel`         | `string`                                   | ✅       | ARIA label for the `<table>`.                              |
| `renderCell`        | `(row: T, columnKey: string) => ReactNode` | ❌       | Per-cell visual rendering. Switches on `columnKey`.        |
| `accessor`          | `(row: T, columnKey: string) => unknown`   | ❌       | Per-cell value used for sort/filter/group/facet.           |
| `loading`           | `boolean`                                  | ❌       | Skeleton view while data loads.                            |
| `emptyStateMessage` | `ReactNode`                                | ❌       | Fallback when `rows` is empty. Default: `'No data available'`. |
| `errorStateMessage` | `ReactNode \| null`                        | ❌       | Renders an error placeholder in place of the table.        |
| `className`         | `string`                                   | ❌       | Wrapper class.                                             |
| `dataTestId`        | `string`                                   | ❌       | Base test id. All sub-elements derive from this.           |

### Toolbar

| Prop                      | Type                                                                                    | Description                                                |
| ------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `id`                      | `string`                                                                                | Prefix for nested element ids and test ids.                |
| `title`                   | `string`                                                                                | Heading above the table (Carbon `TableContainer.title`).   |
| `description`             | `string`                                                                                | Sub-heading.                                               |
| `actionButtons`           | `{ label, disabled?, onClick?, props? }[]`                                              | Optional toolbar action buttons. Renders with a 1 px gap between each button. |
| `enableGlobalSearch`      | `boolean`                                                                               | Adds a toolbar search box that filters across all columns. |
| `globalSearchPlaceholder` | `string`                                                                                | Placeholder text. Defaults to `'Search'`.                  |

### Row expansion

| Prop                    | Type                                                | Description                                  |
| ----------------------- | --------------------------------------------------- | -------------------------------------------- |
| `renderExpandedContent` | `(row: T) => ReactNode`                             | Expanded row content. Pass to enable expansion. |
| `shouldRowBeExpandable` | `(row: T) => boolean`                               | Optional predicate. Rows where this returns false get an aligned spacer instead of an expand toggle. |
| `initialExpandedRows`   | `string[]`                                          | Row ids expanded on mount.                   |

### Pagination

| Prop                | Type                                                | Description                                                |
| ------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `enablePagination`  | `boolean`                                           | Renders the Carbon `Pagination` footer.                    |
| `pageSize`          | `number`                                            | Default page size.                                         |
| `pageSizes`         | `number[]`                                          | Available page sizes in the footer dropdown.               |
| `page`              | `number`                                            | Controlled page number (1-based).                          |
| `onPageChange`      | `(page: number, pageSize: number) => void`          | Fires on page or page-size change.                         |
| `totalItems`        | `number`                                            | Required when `manualPagination`.                          |
| `manualPagination`  | `boolean`                                           | Server-side mode — parent slices rows; DataTable doesn't.  |

---

## Column definition

```ts
interface DataTableColumn<T> {
  key: string;                                       // matches the renderCell / accessor switch
  header: string;                                    // pre-translated
  enableSorting?: boolean;
  defaultSortDirection?: "asc" | "desc";
  enableFiltering?: boolean;
  filterType?: "text" | "select" | "dateRange";
  filterOptions?: { value: string; label: string }[]; // optional override; auto-derived if omitted
  enableGrouping?: boolean;
  width?: string;
  align?: "left" | "right" | "center";
}
```

Headers should be pre-translated by the caller (`t('MEDICATIONS_NAME')`),
matching the convention of the older Bahmni tables.

---

## Custom rendering: `renderCell` and `accessor`

Both are **table-level** functions keyed by `columnKey`. They mirror each
other:

- `renderCell(row, columnKey)` returns the **visual** cell (JSX) — tags, icons,
  formatted dates, composed names, etc.
- `accessor(row, columnKey)` returns the **value** used for sort, filter,
  group, and facet — typically a plain string or number.

Return `undefined` from `accessor` for columns where `row[columnKey]` is
already correct; the table falls back to `row[columnKey]`.

```tsx
const renderCell = (row: Medication, key: string) => {
  switch (key) {
    case "status":
      return <Tag type={row.status === "active" ? "green" : "gray"}>{row.status}</Tag>;
    case "orderDate":
      return formatDateTime(row.orderDate, t).formattedResult;
    case "applicantName":
      return [row.givenName, row.familyName].filter(Boolean).join(" ");
    default:
      return row[key as keyof Medication] ?? "—";
  }
};

const accessor = (row: Medication, key: string) => {
  switch (key) {
    // Status filter dropdown and group rows should show the translated label,
    // not the raw status code.
    case "status":
      return t(`MED_STATUS_${row.status.toUpperCase()}`);
    // Date range filter and date sort need a numeric timestamp, not a string.
    case "orderDate":
      return new Date(row.orderDate).getTime();
    // Group "Applicant Name" by full name.
    case "applicantName":
      return [row.givenName, row.familyName].filter(Boolean).join(" ");
    default:
      return undefined; // fall back to row[key]
  }
};

<DataTable
  columns={columns}
  rows={rows}
  ariaLabel="Medications"
  renderCell={renderCell}
  accessor={accessor}
/>
```

**Rule of thumb:** if the cell renders a value that's transformed from the row
(translation, composition, formatting), add an accessor case so
group labels, filter dropdowns, and sorting all use the same logical value the
user sees.

---

## Sorting

Per-column opt-in:

```tsx
const columns = [
  { key: "name", header: "Medication", enableSorting: true },
  { key: "orderDate", header: "Ordered On", enableSorting: true,
    defaultSortDirection: "desc" },
  { key: "status", header: "Status" }, // not sortable
];
```

Multi-column sort: shift-click a second sortable header — TanStack handles it.

---

## Filtering

Three filter types. Show the filter row by clicking the funnel icon in the
toolbar.

### Text filter

```tsx
{ key: "name", header: "Medication", enableFiltering: true, filterType: "text" }
```

Substring match (case-insensitive) against the accessor value.

### Multi-select filter (with faceting)

```tsx
{ key: "status", header: "Status", enableFiltering: true, filterType: "select" }
```

Renders a `FilterableMultiSelect`. Options are auto-derived from the data
(faceted unique values, sorted alphabetically, labeled with counts: `Active
(12)`). To override, pass `filterOptions`.

Empty selection means **no filter** — no explicit "All" option needed.

### Date range filter

```tsx
{ key: "orderDate", header: "Ordered On", enableFiltering: true, filterType: "dateRange" }
```

Renders a Carbon range `DatePicker`. The column's accessor **must return a
timestamp** (number) — the filter compares against `[startMs, endMs]`.

### Clearing filters

The funnel icon doubles as a clear-all when any filter is active — its label
changes from `Filters` to `Clear filters (N)` and clicking it wipes all column
filters and closes the filter row.

Per-input clears (the × inside each input) are provided by Carbon natively.

---

## Global search

Adds a search box to the toolbar. Searches across every column's accessor
value.

```tsx
<DataTable ... enableGlobalSearch globalSearchPlaceholder="Search medications" />
```

Default placeholder is `'Search'` if omitted. The input collapses to an icon
until the user clicks it.

---

## Grouping

Add `enableGrouping: true` on the columns you want to allow grouping by. A
`Group by ▾` dropdown appears in the toolbar listing those columns.

```tsx
{ key: "status", header: "Status", enableGrouping: true }
```

Group rows show the group's label and count: `Status: Active (12)`. Click the
row to collapse/expand.

The group label uses the column's accessor value — same value the user sees in
the cell.

---

## Row expansion

Pass `renderExpandedContent` to enable. The function returns what to render
beneath the row when it's expanded — typically a Carbon `TableExpandedRow`
with detail content.

```tsx
<DataTable
  ...
  renderExpandedContent={(row) => (
    <TableExpandedRow colSpan={columns.length + 1}>
      <div>Route: {row.route} · Site: {row.site}</div>
    </TableExpandedRow>
  )}
  shouldRowBeExpandable={(row) => row.hasDetails}
/>
```

`shouldRowBeExpandable` is optional. When it returns `false` for a row, that
row gets an aligned spacer cell instead of an expand toggle — keeps column
alignment when some rows have details and others don't.

---

## Pagination

### Client-side

The DataTable slices internally.

```tsx
<DataTable ... enablePagination pageSize={10} pageSizes={[5, 10, 25, 50]} />
```

### Server-side (manual)

The parent fetches the right page; DataTable doesn't slice.

```tsx
<DataTable
  ...
  enablePagination
  manualPagination
  page={currentPage}
  pageSize={pageSize}
  totalItems={totalFromServer}
  onPageChange={(page, size) => refetch({ page, size })}
/>
```

---

## Toolbar header and action buttons

```tsx
import { Add } from '@carbon/icons-react';

<DataTable
  ...
  id="orders"
  title="Recent Orders"
  description="Last 30 days"
  actionButtons={[
    {
      label: "Add order",
      onClick: () => openAddDialog(),
      props: { renderIcon: Add },          // optional icon
    },
    {
      label: "Export",
      onClick: () => exportData(),
      props: { kind: "tertiary" },         // outlined style for secondary actions
    },
  ]}
/>
```

`title` renders an `<h4>` above the table (Carbon's `TableContainer.title`).
`description` is the subtext. `id` is used as a prefix for each action button's
id / data-testid so multiple tables on one page stay unique.

`actionButtons` accepts any number of buttons. Each button's `props` field takes
`Partial<ButtonProps>` (Carbon button props), so you can control `kind`, `renderIcon`,
`iconDescription`, `hasIconOnly`, and so on:

| `kind`        | appearance                              |
| ------------- | --------------------------------------- |
| `"primary"` (default) | solid filled (theme primary colour) |
| `"secondary"` | solid dark fill                         |
| `"tertiary"`  | outlined, transparent background        |
| `"ghost"`     | no background — use for icon-only buttons |

Icon-only toolbar button example:

```tsx
import { TrashCan } from '@carbon/icons-react';

{
  label: "Delete",
  onClick: () => deleteSelected(),
  props: {
    kind: "ghost",
    hasIconOnly: true,
    iconDescription: "Delete selected",
    renderIcon: TrashCan,
  },
}
```

---

## Example: full radiology worklist

```tsx
const columns: DataTableColumn<ServiceRequest>[] = [
  { key: "applicantName", header: t("APPLICANT_NAME"), enableSorting: true,
    enableFiltering: true, filterType: "text" },
  { key: "status", header: t("STATUS"),
    enableFiltering: true, filterType: "select", enableGrouping: true },
  { key: "orderDate", header: t("ORDERED_ON"), enableSorting: true,
    defaultSortDirection: "desc",
    enableFiltering: true, filterType: "dateRange" },
  { key: "actions", header: t("ACTIONS") },
];

const renderCell = (row: ServiceRequest, key: string) => {
  switch (key) {
    case "status": return <StatusTag label={t(`STATUS_${row.status}`)} />;
    case "orderDate": return formatDate(row.orderDate);
    case "actions": return <Actions row={row} />;
    default: return row[key as keyof ServiceRequest] ?? "—";
  }
};

const accessor = (row: ServiceRequest, key: string) => {
  switch (key) {
    case "status": return t(`STATUS_${row.status}`);
    case "orderDate": return new Date(row.orderDate).getTime();
    default: return undefined;
  }
};

<DataTable
  columns={columns}
  rows={requests}
  ariaLabel="Service requests"
  loading={isLoading}
  errorStateMessage={error ? t("FETCH_ERROR") : null}
  emptyStateMessage={t("NO_REQUESTS")}
  renderCell={renderCell}
  accessor={accessor}
  enableGlobalSearch
  enablePagination
  pageSize={10}
  renderExpandedContent={(row) => <RequestDetails row={row} />}
  shouldRowBeExpandable={(row) => row.hasDetails}
/>
```

---

## Migration

Equivalent configurations for the older tables:

| Existing                   | `DataTable` equivalent                                                        |
| -------------------------- | ----------------------------------------------------------------------------- |
| `SimpleDataTable`          | Bare `<DataTable columns rows ariaLabel />`.                                  |
| `SortableDataTable`        | Add per-column `enableSorting` and (if needed) `enablePagination` props.      |
| `ExpandableDataTable`      | Pass `renderExpandedContent` (and optionally `shouldRowBeExpandable`).        |
| `ActionDataTable`          | Add `id`, `title`, `description`, `actionButtons` — sort/pagination inline.   |

The older components remain exported. There's no forced migration; consumers
move when they need filtering, grouping, search, or want a single component
covering all four use cases.

---

## Testing

Match the existing pattern — `@testing-library/react` + `jest-axe`. A few
notes specific to DataTable:

- Carbon's `Dropdown` (used for the group-by control) calls
  `scrollIntoView`, which jsdom doesn't implement. Stub it once in
  the test file:
  ```ts
  beforeAll(() => { Element.prototype.scrollIntoView = jest.fn(); });
  ```
- Sort headers: click on the visible header text — the sortable `<th>` has the
  click handler.
- Filter inputs are inside a row that only renders when the filter toggle is
  open. Click `screen.getByTestId('<dataTestId>-filter-toggle')` first.
- The empty `TableExpandHeader` cell still trips axe's `empty-table-header`
  rule on some Carbon versions; disable that single rule in axe options if
  you hit it.

---

## Common pitfalls

| Issue                                                | Cause                                                                   | Fix                                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Grouping by `status` shows one bucket `Status: ()`   | `row.status` doesn't exist; status is derived in `renderCell`           | Add an `accessor` case that returns the same label the cell renders                       |
| Multi-select filter shows UUIDs                      | Accessor returns a raw UUID                                             | Have the accessor return the translated / display label                                   |
| Date range filter narrows to nothing                 | Accessor returns a formatted string                                     | Accessor must return a timestamp (number) for `filterType: "dateRange"`                   |
| Sort by date is alphabetical                         | Accessor returns formatted text                                         | Accessor must return a number or `Date.getTime()` for date sorting                        |
| `TypeError: ... scrollIntoView is not a function`    | jsdom doesn't implement it                                              | Stub on `Element.prototype` in test setup                                                 |
| Filter row missing when `enableFiltering` is set     | Filter row is closed by default                                         | Click the filter toggle in the toolbar to open it                                         |

---

## Accessibility

- `ariaLabel` is required.
- Sortable headers, expand toggles, and the toolbar controls all use Carbon's
  accessible implementations.
- The expand-header cell uses a visually-hidden screen reader label to
  satisfy axe's `empty-table-header` rule.
- When passing custom JSX from `renderCell`, keep semantic HTML and ARIA
  roles consistent.
