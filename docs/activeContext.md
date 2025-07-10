# Active Context: React Registration Module Migration

## Task Description and Business Context

**Objective**: Rebuild the registration module from the older AngularJS-based `openmrs-module-bahmniapps/ui/app/registration` into React within the `bahmni-clinical-frontend` repository.

**Business Context**:

- Migrating from legacy AngularJS to modern React TypeScript architecture
- Registration module is a critical entry point for patient management in Bahmni
- Must maintain feature parity while improving user experience and maintainability
- Integration with existing React clinical frontend infrastructure

## Key References

### Source Materials

- **Legacy AngularJS Code**: `openmrs-module-bahmniapps/ui/app/registration`
- **Knowledge Graph**: Registration module converted into Neo4j knowledge graph with nodes, edges, relations and observations
- **Build Order Analysis**: `complete_correct_registration_build_order_result.json` and `complete_correct_registration_build_order_documentation.md`

### Target Architecture

- **Framework**: React with TypeScript
- **Styling**: SCSS modules with Carbon Design System compliance
- **State Management**: Custom hooks and stores (following existing patterns)
- **Testing**: Jest + React Testing Library with >90% coverage requirement
- **Accessibility**: WCAG 2.1 AA compliance
- **i18n**: React-i18next integration

## Technical Architecture Overview

### Core Components Structure

``` text
src/
├── components/registration/
│   ├── search/               # Patient search functionality
│   │   ├── PatientSearchForm.tsx
│   │   ├── PatientSearchResults.tsx
│   │   ├── PatientCard.tsx
│   │   └── PatientSearchModal.tsx
│   ├── patient/              # Patient creation/editing
│   │   ├── PatientFormWizard.tsx
│   │   ├── PatientDemographicsForm.tsx
│   │   ├── IdentifierForm.tsx
│   │   ├── AddressForm.tsx
│   │   ├── PersonAttributesForm.tsx
│   │   ├── PatientPhotoCapture.tsx
│   │   ├── FormSummary.tsx
│   │   ├── EditPatientForm.tsx
│   │   ├── RelationshipManager.tsx
│   │   └── PatientHistory.tsx
│   └── common/               # Shared registration components
│       └── Pagination.tsx
├── hooks/registration/       # Registration-specific hooks
│   ├── usePatientSearch.ts
│   ├── usePatientForm.ts
│   ├── useAddressHierarchy.ts
│   ├── usePatientEdit.ts
│   ├── useRelationships.ts
│   └── usePatientHistory.ts
├── services/registration/    # Registration services
│   └── registrationService.ts
├── stores/registration/      # Registration state management
│   ├── registrationStore.ts
│   └── patientFormStore.ts
├── types/registration/       # TypeScript interfaces
│   ├── index.ts
│   ├── relationships.ts
│   └── history.ts
├── utils/registration/       # Registration utilities
│   ├── patientMapper.ts
│   ├── patientValidation.ts
│   └── performanceUtils.ts
└── pages/registration/       # Route components
    ├── PatientSearchPage.tsx
    ├── CreatePatientPage.tsx
    └── EditPatientPage.tsx
```

### Key Features to Implement

#### 1. Patient Search (search.html equivalent)

- Advanced search with multiple criteria
- General search (name, ID, phone)
- Specific field searches (given name, family name, gender, birthdate)
- Paginated results with patient cards
- Search result caching and debouncing

#### 2. Patient Creation (newpatient.html equivalent)

- Multi-step wizard form with navigation
- Demographics form with age/birthdate calculations
- Dynamic identifier management with validation
- Address hierarchy with manual entry fallback
- Person attributes based on configuration
- Photo capture (camera + file upload)
- Form validation and error handling
- Data summary and confirmation

#### 3. Patient Editing (editpatient.html equivalent)

- Tabbed interface (Demographics, Relationships, History)
- Form reuse from creation workflow
- Relationship management with patient search
- Patient history tracking and export
- Delete functionality with confirmation
- Audit trail display

### Data Flow Architecture

#### State Management Pattern

```typescript
// Store Pattern
useRegistrationStore() {
  // Global registration state
  identifierTypes: PatientIdentifierType[]
  personAttributeTypes: PersonAttributeType[]
  currentPatient: OpenMRSPatient | null
  searchResults: PatientSearchResult[]
  isLoading: boolean
  error: string | null
}

// Form State Pattern
usePatientFormStore() {
  // Form-specific state
  formData: PatientFormData
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isDirty: boolean
}
```

#### Service Layer Pattern

```typescript
// Service abstraction for OpenMRS REST API
registrationService: {
  // Patient operations
  searchPatients(criteria: PatientSearchCriteria): Promise<PatientSearchResult[]>
  createPatient(data: CreatePatientRequest): Promise<OpenMRSPatient>
  updatePatient(uuid: string, data: UpdatePatientRequest): Promise<OpenMRSPatient>
  deletePatient(uuid: string): Promise<void>
  
  // Configuration
  getIdentifierTypes(): Promise<PatientIdentifierType[]>
  getPersonAttributeTypes(): Promise<PersonAttributeType[]>
  getAddressHierarchy(): Promise<AddressLevel[]>
  
  // Relationships
  getPatientRelationships(uuid: string): Promise<Relationship[]>
  createRelationship(data: CreateRelationshipRequest): Promise<Relationship>
  
  // History
  getPatientHistory(uuid: string, filter?: HistoryFilter): Promise<PatientHistoryEntry[]>
}
```

## Design Patterns and Standards

### Component Design Principles

- **Atomic Design**: Atoms → Molecules → Organisms → Pages
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Use composition for complex components
- **Props Interface**: All components have typed props interfaces
- **Error Boundaries**: Graceful error handling at component level

### TypeScript Standards

- **Strict Mode**: `strict: true` in tsconfig.json
- **No Any**: Avoid `any` type, use `unknown` with type guards
- **Interface First**: Define interfaces before implementation
- **Generic Constraints**: Use proper generic constraints for reusability

### Testing Strategy

- **TDD Approach**: Red-Green-Refactor cycle
- **Unit Tests**: Every component, hook, and service function
- **Integration Tests**: Complete user workflows
- **Accessibility Tests**: Keyboard navigation and screen reader support
- **Performance Tests**: Search responsiveness and form validation

### Performance Optimizations

- **React.memo**: For pure components that re-render frequently
- **useCallback/useMemo**: For expensive calculations and stable references
- **Lazy Loading**: Route-level code splitting with React.lazy
- **Debouncing**: Search inputs and form validation
- **Image Optimization**: Photo compression and resizing

## Integration Points

### Existing Bahmni Clinical Frontend

- **Navigation**: Integration with existing header and side navigation
- **Notification System**: Use existing notification context
- **Styling**: Follow existing SCSS variable and theme patterns
- **API Client**: Extend existing API service layer
- **i18n**: Add to existing translation system

### OpenMRS Backend Integration

- **REST API**: OpenMRS 2.x REST API endpoints
- **FHIR Compatibility**: Consider FHIR R4 compatibility where applicable
- **Authentication**: Existing session-based auth
- **Permissions**: Role-based access control integration

## Configuration and Customization

### Registration Configuration

```typescript
REGISTRATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_SEARCH_RESULTS: 100,
  SEARCH_DEBOUNCE_MS: 300,
  MAX_PHOTO_SIZE_MB: 5,
  SUPPORTED_PHOTO_FORMATS: ['image/jpeg', 'image/png'],
  AUTO_CALCULATE_AGE: true,
  REQUIRED_IDENTIFIERS_MIN: 1,
  ADDRESS_HIERARCHY_ENABLED: true,
}
```

### Validation Rules

- **Name Fields**: 2-50 characters, letters/spaces/hyphens only
- **Age/Birthdate**: Either required, age 0-150, birthdate after 1900
- **Identifiers**: Format validation, uniqueness checking
- **Photo**: Size limits, format restrictions
- **Address**: Optional but validated if provided

## Security Considerations

### Data Protection

- **No Local Storage**: Sensitive patient data never stored locally
- **XSS Prevention**: Sanitize all user inputs and API responses
- **CSRF Protection**: Follow existing CSRF token patterns
- **Input Validation**: Client and server-side validation
- **Error Handling**: No sensitive information in error messages

### Access Control

- **Permission Checks**: Verify user permissions for each operation
- **Audit Logging**: Track all patient data modifications
- **Session Management**: Respect existing session timeout
- **Role-Based UI**: Show/hide features based on user roles

## Browser and Device Support

### Target Browsers

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions  
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Device Support

- **Desktop**: Primary target, 1024px+ width
- **Tablet**: Secondary support, 768px-1023px width
- **Mobile**: Basic support, responsive design down to 320px

### Accessibility Requirements

- **WCAG 2.1 AA**: Full compliance required
- **Keyboard Navigation**: All functions accessible via keyboard
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Management**: Clear focus indicators and logical tab order

## Migration Strategy

### Phase-by-Phase Implementation

1. **Foundation & Infrastructure**: Core types, services, stores
2. **Services & Data Layer**: API integration, validation, utilities  
3. **Patient Search**: Search functionality as entry point
4. **Patient Creation**: New patient registration workflow
5. **Patient Editing**: Edit capabilities with history and relationships
6. **Visit Management**: Integration with visit workflows
7. **Advanced Features**: Bulk operations, reporting, configurationpreparation

### Risk Mitigation

- **Incremental Rollout**: Feature flags for gradual deployment
- **Fallback Strategy**: Keep AngularJS version available during transition
- **Data Migration**: Ensure no data loss during migration
- **User Training**: Provide documentation and training materials
- **Performance Monitoring**: Track performance metrics post-deployment

## Success Metrics

### Technical Metrics

- **Code Coverage**: >90% test coverage
- **Performance**: <2s page load, <500ms interactions
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Bundle Size**: <500KB gzipped for registration module
- **Error Rate**: <1% client-side errors

### User Experience Metrics

- **Task Completion**: >95% successful patient creation/editing
- **User Satisfaction**: Feedback scores from clinical staff
- **Training Time**: <2 hours for existing users to adapt
- **Error Recovery**: Clear error messages and recovery paths
- **Mobile Usability**: Functional on tablet devices

This comprehensive migration plan ensures a robust, scalable, and user-friendly registration module that maintains feature parity while significantly improving the development experience and code maintainability.
