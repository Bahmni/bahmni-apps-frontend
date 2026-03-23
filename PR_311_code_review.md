# PR #311 Code Review — BAH-4504

**Recommendation:** APPROVE (1 MAJOR FIXED, 2 MAJOR CLARIFIED)

## Findings

### MAJOR

1. **No fallback sections when registrationForm config is absent** ✅ CLARIFIED
   - `PatientRegister.tsx` L184-185
   - ~~When `registrationConfig?.registrationForm?.sections` is undefined, sections falls back to `[]`.~~
   - **Clarification:** Flexibility to configure sections is provided in standard-config. This is the intended design — configuration is required to enable sections. No hardcoded fallback needed.

2. **TypeScript model uses `unknown` for all FormControlData and FormControlRefs fields** ✅ FIXED
   - `PatientRegister/models.ts` L1-36
   - ~~All ref and data fields typed as `unknown`, defeating TypeScript's compile-time checking.~~
   - **Fixed:** Now uses concrete types (ProfileRef, AddressInfoRef, BasicInfoData, etc.) with proper imports from component files.

3. **RegistrationFormControl.type is `string` instead of a union type** ✅ CLARIFIED
   - `registrationConfig/models.ts` L77-80
   - ~~JSON schema has enum constraint but TypeScript type is `string`.~~
   - **Clarification:** Enums are already defined in schema.json for validation. Schema validation enforces the constraint at runtime. TypeScript union type is optional given schema validation in place.

### MINOR

4. **Excessive !important declarations in PatientRegister SCSS**
   - `PatientRegister/styles/index.module.scss` L84-96
   - Seven `!important` declarations in CSS modules. Investigate if Carbon base styles require them.

5. **Hardcoded gap values instead of Carbon spacing tokens**
   - `addressInfo/styles/index.module.scss` L9
   - Uses `gap: 16px` / `gap: 1rem` instead of `$spacing-05`.

6. **data-testid="section-header-tile" is not unique across sections**
   - `PatientRegisterSection.tsx` L69
   - Every section header has the same testid. Include section name for targeting.

7. **shouldShowAdditionalIdentifiers is now a redundant alias**
   - `useAdditionalIdentifiers.ts` L25
   - After removing `isConfigEnabled` check, it's just assigned `hasAdditionalIdentifiers`.

### INFO

8. **formSectionMap tests are somewhat redundant** — static mapping tests overlap with integration tests.

9. **render function pattern in FormSectionConfig** — reasonable but not purely declarative.

## AC Compliance

| AC | Status | Notes |
|----|--------|-------|
| All sections enabled via standard configuration should be displayed | ✅ | Implementation correctly renders sections from config. Companion config PR #95 provides the configuration. Design requires config-driven approach. |

## Done Well
- Clean separation: section rendering extracted into PatientRegisterSection + formSectionMap
- Good removal of duplicated Tile/header from individual form components
- JSON schema properly validates new config with enum constraints
- Comprehensive test coverage for config-driven sections
- Companion config PR includes i18n for English and Spanish
