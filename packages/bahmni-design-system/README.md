# @bahmni/design-system

## Description

A reusable React component library built on [Carbon Design System](https://carbondesignsystem.com/), designed for building modern healthcare and enterprise web applications.

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test @bahmni/design-system` to execute the unit tests via [Vitest](https://vitest.dev/)

## Migration notes

### `Header` — `extraContent` is deprecated

The `Header` `extraContent` prop is **deprecated** and will be removed in the next
major release (v2). It rendered arbitrary nodes outside the header's structured
slots, which made layout inconsistent across apps. Use the dedicated slots instead:

| Old (`extraContent`)                                  | New slot                                             |
| ----------------------------------------------------- | ---------------------------------------------------- |
| `<HeaderName prefix="Home">Bahmni</HeaderName>`       | `brandName="Bahmni"` + `brandPrefix="Home"` (+ `brandHref`) |
| Self-contained controls, e.g. `<LocationSelector />`  | `globalFeatures={[<LocationSelector />]}`            |
| User menu, e.g. `<UserGlobalAction />`                | `userMenu={<UserGlobalAction />}`                    |

**Before**

```tsx
<Header
  extraContent={
    <>
      <HeaderName prefix="Home" href="/">Bahmni</HeaderName>
      <LocationSelector />
      <UserGlobalAction />
    </>
  }
/>
```

**After**

```tsx
<Header
  brandName="Bahmni"
  brandPrefix="Home"
  brandHref="/"
  globalFeatures={[<LocationSelector key="location" />]}
  userMenu={<UserGlobalAction />}
/>
```
