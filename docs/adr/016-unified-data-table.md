# ADR-016: Unify Bahmni table components into a single DataTable

| | |
|---|---|
| **Status** | Proposed |
| **Date** | 2026-05-26 |
| **Authors** | Frontend / Design System |

## Context

The Bahmni design system today exposes four separate table components:

1. `SimpleDataTable` — read-only, no interaction
2. `SortableDataTable` — adds sort + pagination
3. `ExpandableDataTable` — adds row expansion (no pagination)
4. `ActionDataTable` — wraps `SortableDataTable` with a toolbar + action button

Each is a thin wrapper around Carbon's `DataTable` primitives. They share
roughly the same column shape (`key` + `header`), the same `renderCell`
contract, and the same loading / empty / error handling — but reimplement
each of those slightly differently. Consumers choose one upfront based on
the dominant feature they need.

Beyond the existing four, real product needs have emerged that none of them
satisfy:

- Column-level filtering (text inputs in column headers)
- Multi-select filters with auto-derived options (faceting)
- Global search across all columns
- Grouping by column value with collapsible group rows
- Date-range filters
- Toolbar action button + pagination + expansion in the same table


## Problems with the current approach

1. **Feature gaps cannot be filled without forking.**
   Filtering, search, grouping, faceted dropdowns, and date-range filters
   don't exist in any of the four variants. Each new product requirement
   triggers either a fork inside the consumer or a request to add the
   feature to one specific variant — which then diverges from the others.

2. **Pagination lives in only one variant.**
   The moment a team needs sorting + pagination + expansion, they have to
   pick one variant and lose the others. No combination of the existing
   four supports it.

3. **Inconsistent prop shapes.**
   `sortable` config, expansion contract, action button, `dataTestId`
   conventions, and loading state all use slightly different patterns
   across the four. Migrating between variants is a rewrite, not a config
   change.

4. **Code duplication.**
   Skeleton rendering, empty state, error state, and `renderCell` wiring
   are reimplemented in each variant. Bug fixes have to be applied four
   times. The SCSS module files are near-duplicates.

5. **Decision fatigue and lock-in.**
   Consumers spend time picking which variant fits, and often outgrow it
   within months. Once chosen, switching variants is a non-trivial PR.

6. **Test surface area.**
   Four test suites with overlapping coverage. Adding a new behaviour
   means deciding which one(s) to extend; bug-fix coverage is uneven.

7. **Tightly coupled to Carbon's `DataTable` HOC.**
   Each variant uses Carbon's high-level `DataTable` component, which owns
   sort/expand state internally. This blocks features (filter, group)
   that need an external state engine.

## Decision

Introduce a single, unified `DataTable` organism in the design system that:

- Uses **TanStack Table** (`@tanstack/react-table` v8) as the state and
  pipeline engine (sort → filter → group → expand → paginate)
- Renders through **Carbon's low-level table primitives** (`Table`,
  `TableHead`, `TableRow`, `TableCell`, `TableExpandRow`, `TableContainer`,
  `TableToolbar`, `Pagination`), preserving full visual parity with the
  current design
- Exposes a single declarative API where columns declare what they support
  (sort, filter, group, filter type) and the table-level props cover the
  rest (`renderCell`, `accessor`, expansion, search, pagination, toolbar)
- **Coexists** with the existing four variants; no forced migration

Feature coverage of the unified component:

- Per-column sorting (single + shift-click multi-column)
- Per-column filtering: text, multi-select with faceted unique values,
  date range
- Global search
- Grouping with collapsible group rows
- Row expansion with a `shouldRowBeExpandable` predicate
- Pagination, both client-side and manual (server-driven)
- Toolbar with title, description, and optional action button
- Loading / empty / error states

## Implementation Plan:
- First step brings in the DataTable design system component and exposes it for consumers.
- The existing consumers of the other variants as of this ADR date is not migrated.
- Any new widget / feature being built in any app needs to use the DataTable component
- We ought to migrate the existing widgets oppurtunitically when we extend any features on those widgets.

## Considered alternatives

### A. Extend each existing variant to add the missing features

Rejected. Multiplies the inconsistency problem; consumers still have to
choose. Bug fixes still applied multiple times. Doesn't address the
underlying coupling to Carbon's stateful `DataTable` HOC.

### B. Migrate to AG Grid or another third-party grid

Rejected. Heavy bundle cost. Visual mismatch with Carbon. Licensing
concerns for AG Grid enterprise features. Replaces a coupling problem
with a vendor lock-in.

### C. Build a headless table primitive and let each consumer compose their own UI

Rejected for the design system level. Acceptable for power users via the
underlying TanStack hook, but the design system's job is to provide a
ready-to-use component matching Bahmni conventions.

## Consequences

### Benefits

- **One mental model.** Consumers learn one API, not four.
- **Closes the feature gaps** that triggered in-consumer workarounds.
- **Single source of truth** for skeleton, empty, error, and `renderCell`
  conventions. Bug fixes land once.
- **Feature opt-in is granular.** Bare `DataTable` = `SimpleDataTable`;
  add column flags = `SortableDataTable`; add `renderExpandedContent` =
  `ExpandableDataTable`; add `title` + `actionButton` = `ActionDataTable`.
- **Composable pipeline.** TanStack's sort → filter → group → expand →
  paginate composes naturally; no more "this feature blocks that feature"
  tradeoffs.
- **Faceted unique values.** Status / location / category filters get
  auto-populated option lists with counts — no manual option arrays.
- **Headless state engine** decouples us from Carbon's `DataTable` HOC
  limits.
- **Test surface area consolidates.** One tested component replaces four.

### Costs

- New runtime dependency: `@tanstack/react-table` (~14 KB gzip).
- Larger surface area in the design system: ~14 internal sub-components
  and ~330 lines of test coverage. Maintained centrally instead of in
  consumer code.
- Existing components remain exported during the migration window;
  consumers and tests will reference both styles for a period.
- Migration is voluntary and self-paced, which lengthens the deprecation
  window for the older variants.

### Risks and mitigations

| Risk | Mitigation |
|---|---|
| Carbon and TanStack updates may diverge. | The TanStack layer is encapsulated in a single hook (`useDataTable`). Carbon primitives are addressed only through Carbon's public API. Both can be upgraded independently. |
| Existing consumers see no immediate benefit and don't migrate. | Each new feature request becomes a migration trigger; teams adopt when they have a reason to. |
| jsdom limitations (`scrollIntoView` on dropdowns, flatpickr locale) complicate tests. | Documented workarounds in the developer guide. |

## References

- Developer guide: [`docs/data-table-guide.md`](../data-table-guide.md)
- Implementation: `packages/bahmni-design-system/src/organisms/dataTable/`
- [TanStack Table v8](https://tanstack.com/table/v8)
- [Carbon DataTable primitives](https://carbondesignsystem.com/components/data-table/usage/)
- [JIRA Ticket for the component](https://bahmni.atlassian.net/browse/BAH-4741)
