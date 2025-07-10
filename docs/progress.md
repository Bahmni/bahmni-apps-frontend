# Registration Module Migration Progress

## Overall Project Status

🔄 **In Progress** - Detailed planning phase completed, ready for implementation

**Current Phase**: Phase 1 - Foundation Setup & Infrastructure  
**Target Completion**: 16 weeks total  
**Start Date**: TBD

---

## Phase 1: Foundation Setup & Infrastructure (Week 1-2)

**Status**: ✅ Completed
**Objective**: Establish core types, services, stores, and infrastructure

### Phase 1 Deliverables

- [ ] **Core TypeScript Interfaces**

  - [ ] `src/types/registration/index.ts` - Main patient and search types
    - [ ] `OpenMRSPatient` interface with person, identifiers, auditInfo
    - [ ] `PatientSearchResult` interface with display, uuid, identifiers
    - [ ] `PatientSearchCriteria` interface with name, identifier, gender, birthdate
    - [ ] `PatientFormData` interface with all form fields and validation
    - [ ] `PatientIdentifierType` and `PersonAttributeType` interfaces
  - [ ] `src/types/registration/relationships.ts` - Relationship types
    - [ ] `Relationship` interface with personA, personB, relationshipType
    - [ ] `RelationshipType` interface with display strings and metadata
    - [ ] `CreateRelationshipRequest` interface
  - [ ] `src/types/registration/history.ts` - Patient history types
    - [ ] `PatientHistoryEntry` interface with changes and metadata
    - [ ] `PatientChanges` interface with demographics, identifiers, address
    - [ ] `HistoryFilter` type union
  - [ ] Integration with existing type system

- [ ] **Registration Configuration**

  - [ ] `src/constants/registration.ts` - Configuration constants
    - [ ] `REGISTRATION_CONFIG` object with all settings
    - [ ] `DEFAULT_PAGE_SIZE: 10`, `MAX_SEARCH_RESULTS: 100`
    - [ ] `SEARCH_DEBOUNCE_MS: 300`, `MAX_PHOTO_SIZE_MB: 5`
    - [ ] `SUPPORTED_PHOTO_FORMATS: ['image/jpeg', 'image/png']`
    - [ ] `REQUIRED_IDENTIFIERS_MIN: 1`, `ADDRESS_HIERARCHY_ENABLED: true`
  - [ ] Environment-specific settings
  - [ ] Default values and limits
  - [ ] API endpoint constants

- [ ] **Base Service Layer**

  - [ ] `src/services/registration/registrationService.ts` - Core service class
    - [ ] `searchPatients(criteria: PatientSearchCriteria): Promise<PatientSearchResult[]>`
    - [ ] `createPatient(data: CreatePatientRequest): Promise<OpenMRSPatient>`
    - [ ] `updatePatient(uuid: string, data: UpdatePatientRequest): Promise<OpenMRSPatient>`
    - [ ] `deletePatient(uuid: string): Promise<void>`
    - [ ] `getIdentifierTypes(): Promise<PatientIdentifierType[]>`
    - [ ] `getPersonAttributeTypes(): Promise<PersonAttributeType[]>`
    - [ ] `getAddressHierarchy(): Promise<AddressLevel[]>`
  - [ ] API endpoint configuration
  - [ ] Error handling patterns (retry logic, timeout handling)
  - [ ] Request/response interceptors

- [ ] **Registration Stores**

  - [ ] `src/stores/registration/registrationStore.ts` - Global registration state
    - [ ] `identifierTypes: PatientIdentifierType[]`
    - [ ] `personAttributeTypes: PersonAttributeType[]`
    - [ ] `currentPatient: OpenMRSPatient | null`
    - [ ] `searchResults: PatientSearchResult[]`
    - [ ] `isLoading: boolean`, `error: string | null`
    - [ ] `addressHierarchy: AddressLevel[]`
  - [ ] `src/stores/registration/patientFormStore.ts` - Form-specific state
    - [ ] `formData: PatientFormData`
    - [ ] `errors: Record<string, string>`
    - [ ] `touched: Record<string, boolean>`
    - [ ] `isValid: boolean`, `isDirty: boolean`
  - [ ] State management patterns
  - [ ] Store integration with existing architecture

- [ ] **Utility Functions**

  - [ ] `src/utils/registration/patientMapper.ts` - Data transformation
    - [ ] `mapOpenMRSToForm(patient: OpenMRSPatient): PatientFormData`
    - [ ] `mapFormToOpenMRS(formData: PatientFormData): CreatePatientRequest`
    - [ ] `mapSearchResultToPatient(result: PatientSearchResult): OpenMRSPatient`
  - [ ] `src/utils/registration/patientValidation.ts` - Validation rules
    - [ ] Name fields: 2-50 characters, letters/spaces/hyphens only
    - [ ] Age/birthdate: Either required, age 0-150, birthdate after 1900
    - [ ] Identifier format validation and uniqueness checking
    - [ ] Photo size limits and format restrictions
  - [ ] `src/utils/registration/performanceUtils.ts` - Performance helpers
    - [ ] `useDebouncedValidation(validateFn, delay = 300)`
    - [ ] `useFormCompleteness(formData)` - Memoized completion calculation
    - [ ] `resizeImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8)`

- [ ] **Testing Infrastructure**
  - [ ] Mock data setup for registration
    - [ ] `src/__mocks__/registrationMocks.ts` - Mock patients, search results
    - [ ] Mock identifier types and person attributes
    - [ ] Mock address hierarchy data
  - [ ] Testing utilities for registration
    - [ ] Form testing utilities
    - [ ] Service testing utilities
  - [ ] Base test configurations

### Phase 1 Action Items

- [ ] Set up development environment
- [ ] Configure TypeScript strict mode
- [ ] Establish folder structure
- [ ] Create base interfaces and types
- [ ] Implement core service layer
- [ ] Set up state management
- [ ] Create utility functions
- [ ] Write foundational tests

### Phase 1 Completion Criteria

- [ ] All TypeScript interfaces defined
- [ ] Service layer structure established
- [ ] State management working
- [ ] Basic validation framework
- [ ] Unit tests for core functions
- [ ] Integration with existing codebase verified

---

## Phase 2: Services & Data Layer (Week 3-4)

**Status**: 🔄 In Progress
**Objective**: Implement API integration, validation, and data transformation

### Phase 2 Deliverables

- [ ] **Registration Service Implementation**

  - [ ] Patient search API integration
  - [ ] Patient CRUD operations
  - [ ] Identifier types and person attributes loading
  - [ ] Address hierarchy integration
  - [ ] Photo upload handling
  - [ ] Error handling and retry logic

- [ ] **Custom Hooks Development**

  - [ ] `usePatientSearch.ts` - Search functionality with debouncing
  - [ ] `usePatientForm.ts` - Form state management
  - [ ] `useAddressHierarchy.ts` - Cascading address selection
  - [ ] Optimization with useCallback and useMemo

- [ ] **Data Mappers & Utilities**
  - [ ] OpenMRS to form data mapping
  - [ ] Form data to OpenMRS mapping
  - [ ] Validation rule implementation
  - [ ] Age/birthdate calculations
  - [ ] Performance optimization utilities

### Phase 2 Action Items

- [ ] Implement complete registration service
- [ ] Create custom hooks for data fetching
- [ ] Build data transformation layer
- [ ] Implement validation framework
- [ ] Add error handling patterns
- [ ] Create performance optimizations
- [ ] Write comprehensive tests

### Phase 2 Testing Requirements

- [ ] **Unit Tests (60+ tests)**

  - [ ] All service methods tested
  - [ ] Custom hooks tested with various scenarios
  - [ ] Data mapper bidirectional testing
  - [ ] Validation rules and edge cases
  - [ ] Error handling scenarios

- [ ] **Integration Tests (20+ tests)**
  - [ ] Service to store integration
  - [ ] Hook to service integration
  - [ ] Error recovery testing

### Phase 2 Completion Criteria

- [ ] All services implemented and tested
- [ ] Custom hooks working with real data
- [ ] Data mappers working bidirectionally
- [ ] Validation system comprehensive
- [ ] Error handling robust
- [ ] Performance benchmarks met

---

## Phase 3: Patient Search Implementation (Week 5-6)

**Status**: ⏳ Not Started  
**Objective**: Build patient search functionality as entry point

### Phase 3 Deliverables

- [ ] **Search Form Components**

  - [ ] `PatientSearchForm.tsx` - Basic and advanced search
    - [ ] Basic search: Single input for name/ID/phone with autocomplete
    - [ ] Advanced search toggle with additional fields
    - [ ] Search criteria: given name, family name, gender, birthdate, identifier
    - [ ] Debounced search input (300ms delay)
    - [ ] Search validation and error handling
    - [ ] Clear search functionality
    - [ ] Search history integration
    - [ ] Keyboard navigation support (Enter to search, Escape to clear)
  - [ ] Form validation and error handling
    - [ ] Required field validation
    - [ ] Format validation (birthdate, identifier patterns)
    - [ ] Search criteria conflict detection
  - [ ] Search criteria management
    - [ ] `PatientSearchCriteria` interface implementation
    - [ ] Search state persistence between navigation
    - [ ] Search criteria reset functionality
  - [ ] Advanced search toggle
    - [ ] Collapsible advanced search panel
    - [ ] Smooth animation transitions
    - [ ] State management for expanded/collapsed

- [ ] **Search Results Components**

  - [ ] `PatientSearchResults.tsx` - Results display with states
    - [ ] Search results grid/list view toggle
    - [ ] Sort functionality (name, age, last visit)
    - [ ] Filter functionality (gender, age range)
    - [ ] Loading state with skeleton cards
    - [ ] Error state with retry functionality
    - [ ] Empty state with helpful suggestions
    - [ ] Results count display
    - [ ] "Load more" functionality for large result sets
  - [ ] `PatientCard.tsx` - Individual patient display
    - [ ] Patient photo display with fallback
    - [ ] Primary identifier prominently displayed
    - [ ] Name, age, gender display
    - [ ] Last visit information
    - [ ] Click to select functionality
    - [ ] Hover states and accessibility
    - [ ] Responsive design for mobile/tablet
  - [ ] Loading, error, and empty states
    - [ ] Loading skeleton for patient cards
    - [ ] Error state with retry button
    - [ ] Empty state with search suggestions
    - [ ] Network error handling
  - [ ] Patient selection handling
    - [ ] Single patient selection
    - [ ] Navigation to patient details
    - [ ] Navigation to create new patient
    - [ ] Keyboard selection support

- [ ] **Common Components**

  - [ ] `Pagination.tsx` - Reusable pagination component
    - [ ] Page number display and navigation
    - [ ] Previous/Next buttons
    - [ ] Jump to page functionality
    - [ ] Page size selection (10, 25, 50, 100)
    - [ ] Total records display
    - [ ] Keyboard navigation support
    - [ ] Responsive design for mobile
  - [ ] Accessibility compliance
    - [ ] ARIA labels for all interactive elements
    - [ ] Screen reader announcements for search results
    - [ ] Focus management for search interactions
    - [ ] High contrast mode support
  - [ ] Keyboard navigation support
    - [ ] Tab order optimization
    - [ ] Arrow key navigation in results
    - [ ] Enter/Space for selection
    - [ ] Escape for cancellation

- [ ] **Search Page Implementation**
  - [ ] `PatientSearchPage.tsx` - Main search route
    - [ ] Page layout with header and search sections
    - [ ] Search form and results integration
    - [ ] URL parameter handling for search criteria
    - [ ] Browser history integration
    - [ ] Search result caching
    - [ ] Performance optimization with React.memo
  - [ ] Page layout and structure
    - [ ] Responsive grid layout
    - [ ] Search form in header section
    - [ ] Results section with filters sidebar
    - [ ] Mobile-first responsive design
  - [ ] Integration with existing navigation
    - [ ] Breadcrumb navigation
    - [ ] Back button functionality
    - [ ] Side navigation integration
    - [ ] Page title and meta tag updates

### Phase 3 Action Items

- [ ] Design and implement search form
- [ ] Create search results display
- [ ] Build pagination component
- [ ] Implement search page layout
- [ ] Add responsive design
- [ ] Implement accessibility features
- [ ] Create comprehensive tests

### Phase 3 Testing Requirements

- [ ] **Unit Tests (25+ tests)**

  - [ ] Search form component testing
  - [ ] Search results component testing
  - [ ] Pagination component testing
  - [ ] Patient card component testing

- [ ] **Integration Tests (5+ tests)**
  - [ ] Complete search workflow
  - [ ] Error handling scenarios
  - [ ] Pagination with search

### Phase 3 Completion Criteria

- [ ] Search functionality working end-to-end
- [ ] Responsive design implemented
- [ ] Accessibility compliance verified
- [ ] Performance targets met (<2s search response)
- [ ] All tests passing (>90% coverage)

---

## Phase 4: Patient Creation Workflow (Week 7-8)

**Status**: ⏳ Not Started  
**Objective**: Implement new patient registration workflow

### Phase 4 Deliverables

- [ ] **Form Wizard Infrastructure**

  - [ ] `PatientFormWizard.tsx` - Multi-step form container
    - [ ] 6-step wizard: Demographics → Identifiers → Address → Attributes → Photo → Summary
    - [ ] Step navigation with breadcrumb display
    - [ ] Forward/backward navigation with validation gates
    - [ ] Step validation before proceeding
    - [ ] Progress indicator showing completion percentage
    - [ ] Form state persistence across steps
    - [ ] Exit confirmation modal for unsaved changes
    - [ ] Support for both create and edit modes
    - [ ] Responsive design for mobile/tablet
  - [ ] Step navigation and validation
    - [ ] `canProceed()` validation for each step
    - [ ] Disabled next button until required fields complete
    - [ ] Step completion indicators
    - [ ] Jump to specific step functionality
  - [ ] Form state persistence
    - [ ] Auto-save form data on step change
    - [ ] Session storage for form recovery
    - [ ] Dirty state tracking
  - [ ] Exit confirmation handling
    - [ ] Modal confirmation for unsaved changes
    - [ ] Browser beforeunload event handling
    - [ ] Return to previous page functionality

- [ ] **Form Step Components**

  - [ ] `PatientDemographicsForm.tsx` - Basic information
    - [ ] Given name, middle name, family name fields
    - [ ] Gender selection (M/F/O with radio buttons)
    - [ ] Date of birth OR age input with auto-calculation
    - [ ] Birthdate estimated checkbox
    - [ ] Real-time validation for all fields
    - [ ] Field focus management and tab order
    - [ ] Required field indicators
    - [ ] Error message display
  - [ ] `IdentifierForm.tsx` - Dynamic identifier management
    - [ ] Add/remove identifier functionality
    - [ ] Identifier type selection dropdown
    - [ ] Identifier value input with format validation
    - [ ] Preferred identifier toggle
    - [ ] Location assignment for identifiers
    - [ ] Format validation based on identifier type
    - [ ] Duplicate identifier checking
    - [ ] Required identifier enforcement
  - [ ] `AddressForm.tsx` - Address with hierarchy
    - [ ] Hierarchical address selection (Country → State → District → City)
    - [ ] Manual entry fallback for each level
    - [ ] Address line 1 & 2 free text fields
    - [ ] Postal code field
    - [ ] Address preview display
    - [ ] Loading states for hierarchy loading
    - [ ] Validation for required address fields
  - [ ] `PersonAttributesForm.tsx` - Dynamic attributes
    - [ ] Dynamic form generation based on attribute types
    - [ ] Required vs optional attribute grouping
    - [ ] Support for text, number, boolean, concept attributes
    - [ ] Validation based on attribute type constraints
    - [ ] Conditional attribute display logic
    - [ ] Accessible form controls for all attribute types
  - [ ] `PatientPhotoCapture.tsx` - Photo upload/capture
    - [ ] File upload with drag & drop support
    - [ ] Camera capture functionality (WebRTC)
    - [ ] Photo preview with crop/rotate options
    - [ ] Photo validation (size, format, dimensions)
    - [ ] Image compression and resize
    - [ ] Remove photo functionality
    - [ ] Fallback for devices without camera
    - [ ] Error handling for camera access
  - [ ] `FormSummary.tsx` - Review and confirmation
    - [ ] Complete patient data review
    - [ ] Data completeness indicators
    - [ ] Edit links to return to specific steps
    - [ ] Required field highlighting
    - [ ] Final validation before submission
    - [ ] Submit button with loading state
    - [ ] Success/error message display

- [ ] **Create Patient Page**
  - [ ] `CreatePatientPage.tsx` - Main creation route
    - [ ] Page layout with form wizard integration
    - [ ] Header with page title and navigation
    - [ ] Footer with action buttons
    - [ ] Loading states during form submission
    - [ ] Success redirect to patient profile or visit
    - [ ] Error handling with user-friendly messages
    - [ ] URL state management for deep linking
  - [ ] Form integration and navigation
    - [ ] Seamless wizard step transitions
    - [ ] Validation state management
    - [ ] Navigation breadcrumbs
    - [ ] Progress indicator
  - [ ] Success/error handling
    - [ ] Success message with patient details
    - [ ] Navigation to patient profile
    - [ ] Error message display with retry options
    - [ ] Network error recovery

### Phase 4 Action Items

- [ ] Implement multi-step form wizard
- [ ] Create all form step components
- [ ] Add photo capture functionality
- [ ] Implement form validation
- [ ] Add data summary and review
- [ ] Create patient creation page
- [ ] Add comprehensive styling
- [ ] Implement accessibility features

### Phase 4 Testing Requirements

- [ ] **Unit Tests (40+ tests)**

  - [ ] Form wizard component testing
  - [ ] Individual form step testing
  - [ ] Photo capture testing
  - [ ] Form summary testing

- [ ] **Integration Tests (10+ tests)**
  - [ ] Complete creation workflow
  - [ ] Form validation scenarios
  - [ ] Error handling and recovery

### Phase 4 Completion Criteria

- [ ] Patient creation workflow complete
- [ ] All form validations working
- [ ] Photo capture functional
- [ ] Form wizard navigation smooth
- [ ] Responsive design implemented
- [ ] Accessibility compliance verified

---

## Phase 5: Patient Editing Capabilities (Week 9-10)

**Status**: 🔄 **Currently Planning** (Detailed plan complete)  
**Objective**: Implement patient modification workflows

### Phase 5 Deliverables

- [ ] **Patient Edit Components**

  - [ ] `EditPatientForm.tsx` - Main edit interface with tabs
    - [ ] Tabbed interface: Demographics → Relationships → History
    - [ ] Patient information header with name, ID, last updated
    - [ ] Action buttons: Start Visit, Delete Patient (conditional)
    - [ ] Loading states for patient data fetching
    - [ ] Error states with retry functionality
    - [ ] Not found state with navigation back
    - [ ] Delete confirmation modal with warnings
    - [ ] Integration with existing notification system
  - [ ] `RelationshipManager.tsx` - Manage patient relationships
    - [ ] Current relationships display with person details
    - [ ] Add new relationship functionality
    - [ ] Relationship type selection from configured types
    - [ ] Patient search modal integration for adding relationships
    - [ ] Remove relationship with confirmation
    - [ ] Loading states for relationship operations
    - [ ] Error handling for relationship failures
    - [ ] Empty state when no relationships exist
  - [ ] `PatientHistory.tsx` - Display change history
    - [ ] Timeline view of all patient changes
    - [ ] Filter by change type (create, update, delete, void)
    - [ ] Expandable entries showing detailed changes
    - [ ] Change comparison (old value → new value)
    - [ ] Export history functionality (CSV format)
    - [ ] Pagination for large history sets
    - [ ] User information for each change
    - [ ] Date/time formatting with relative time
  - [ ] Patient loading and error states
    - [ ] Loading spinner during patient fetch
    - [ ] Error message with retry button
    - [ ] Network error handling
    - [ ] Permission error handling
  - [ ] Delete functionality with confirmation
    - [ ] Delete button (only if patient can be deleted)
    - [ ] Confirmation modal with patient name
    - [ ] Warning about consequences
    - [ ] Secure delete operation with proper authorization

- [ ] **Enhanced Hooks**

  - [ ] `usePatientEdit.ts` - Patient editing operations
    - [ ] `loadPatient()` - Load patient by UUID
    - [ ] `updatePatient()` - Save patient changes
    - [ ] `deletePatient()` - Delete patient with confirmation
    - [ ] `canDelete()` - Check if patient can be deleted
    - [ ] Form validation integration
    - [ ] Error handling and notifications
    - [ ] Loading state management
  - [ ] `useRelationships.ts` - Relationship management
    - [ ] `loadRelationships()` - Get patient relationships
    - [ ] `loadRelationshipTypes()` - Get available relationship types
    - [ ] `addRelationship()` - Create new relationship
    - [ ] `removeRelationship()` - Delete relationship
    - [ ] Relationship validation and error handling
  - [ ] `usePatientHistory.ts` - History tracking
    - [ ] `loadHistory()` - Get patient change history
    - [ ] `exportHistory()` - Export history to CSV
    - [ ] History filtering by change type
    - [ ] Pagination for large datasets
    - [ ] Error handling for history operations
  - [ ] Enhanced form wizard for edit mode
    - [ ] Load existing patient data into form
    - [ ] Support both create and edit modes
    - [ ] Modified navigation for edit context
    - [ ] Update button instead of create button

- [ ] **Additional Components**

  - [ ] `PatientSearchModal.tsx` - Modal for relationship selection
    - [ ] Full-screen modal with search functionality
    - [ ] Reuse PatientSearchForm and PatientSearchResults
    - [ ] Patient selection callback
    - [ ] Exclude current patient from results
    - [ ] Cancel/close functionality
    - [ ] Keyboard navigation support (Escape to close)
  - [ ] Enhanced form wizard with edit mode
    - [ ] Mode detection (create vs edit)
    - [ ] Different button text (Create vs Update)
    - [ ] Pre-populated form fields from existing data
    - [ ] Modified save behavior for updates
  - [ ] Tabbed interface implementation
    - [ ] Tab navigation with keyboard support
    - [ ] Active tab state management
    - [ ] Tab content lazy loading
    - [ ] Tab completion indicators
    - [ ] Responsive tab design

- [ ] **Edit Patient Page**
  - [ ] `EditPatientPage.tsx` - Main edit route
    - [ ] URL parameter extraction (patient UUID)
    - [ ] Page layout with patient edit form
    - [ ] Navigation integration with breadcrumbs
    - [ ] Page title updates with patient name
    - [ ] Error boundary for component failures
    - [ ] Loading state for initial page load
  - [ ] Integration with existing navigation
    - [ ] Breadcrumb navigation (Search → Patient → Edit)
    - [ ] Side navigation integration
    - [ ] Back button functionality
    - [ ] Navigation guards for unsaved changes
  - [ ] URL parameter handling
    - [ ] Patient UUID from URL params
    - [ ] Tab selection from URL hash
    - [ ] Deep linking to specific tabs
    - [ ] Browser history integration

### Phase 5 Action Items

- [ ] Create patient edit form with tabbed interface
- [ ] Implement relationship management
- [ ] Build patient history display
- [ ] Add delete functionality
- [ ] Create patient search modal
- [ ] Enhance form wizard for edit mode
- [ ] Add comprehensive testing
- [ ] Implement accessibility features

### Phase 5 Testing Requirements

- [ ] **Unit Tests (35+ tests)**

  - [ ] Edit form component testing
  - [ ] Relationship manager testing
  - [ ] Patient history testing
  - [ ] Enhanced hooks testing

- [ ] **Integration Tests (8+ tests)**
  - [ ] Complete edit workflow
  - [ ] Relationship management flow
  - [ ] Delete confirmation flow

### Phase 5 Completion Criteria

- [ ] Patient editing fully functional
- [ ] Relationship management working
- [ ] Patient history display complete
- [ ] Delete functionality secure
- [ ] Tabbed interface responsive
- [ ] All tests passing

---

## Phase 6: Visit Management Integration (Week 11-12)

**Status**: ⏳ Not Started  
**Objective**: Create seamless integration between registration module and clinical visit workflows

### Phase 6 Deliverables

- [ ] **Visit Integration Service Layer**

  - [ ] `src/services/registration/visitIntegrationService.ts` - Core visit integration
    - [ ] `getVisitTypes(): Promise<VisitType[]>` - Fetch available visit types
    - [ ] `getAvailableProviders(): Promise<Provider[]>` - Provider selection
    - [ ] `createVisitFromPatient(request: CreateVisitFromPatientRequest): Promise<Visit>`
    - [ ] `validateVisitCreation(patientUuid: string): Promise<VisitValidationResult>`
    - [ ] `checkActiveVisit(patientUuid: string): Promise<Visit | null>`
    - [ ] `preserveRegistrationContext(context: RegistrationContext): void`
  - [ ] Visit type configuration and defaults management
  - [ ] Provider availability checking and assignment
  - [ ] Active visit validation and conflict resolution
  - [ ] Registration context preservation across navigation

- [ ] **Visit Creation Components**

  - [ ] `VisitCreationWizard.tsx` - 3-step visit creation workflow
    - [ ] Visit Type Selection → Provider Assignment → Confirmation
    - [ ] Integration with existing visit creation APIs
    - [ ] Error handling for visit creation failures
    - [ ] Loading states and user feedback
  - [ ] `VisitTypeSelector.tsx` - Visit type selection component
    - [ ] Radio button selection of available visit types
    - [ ] Visit type descriptions and duration estimates
    - [ ] Default selection based on configuration
    - [ ] Validation for required visit types
  - [ ] `ProviderSelector.tsx` - Provider selection component
    - [ ] Provider search functionality with autocomplete
    - [ ] Provider availability display
    - [ ] Multiple provider selection support
    - [ ] Provider information display (name, specialization)
  - [ ] `VisitSummary.tsx` - Visit creation confirmation
    - [ ] Patient information display
    - [ ] Selected visit type and provider confirmation
    - [ ] Visit date/time and location details
    - [ ] Edit links to modify selections
    - [ ] Create visit action with loading state

- [ ] **Enhanced Hooks for Visit Management**

  - [ ] `useVisitCreation.ts` - Visit creation state management
    - [ ] `createVisit(data: CreateVisitRequest): Promise<Visit | null>`
    - [ ] `validatePatientForVisit(patientUuid: string): Promise<boolean>`
    - [ ] `checkActiveVisit(patientUuid: string): Promise<Visit | null>`
    - [ ] Visit type and provider selection state
    - [ ] Error handling and validation
  - [ ] `useRegistrationNavigation.ts` - Navigation state management
    - [ ] Context preservation across module transitions
    - [ ] Navigation stack management
    - [ ] Integration with React Router
    - [ ] Back button handling and breadcrumbs

- [ ] **Navigation Integration Components**

  - [ ] `RegistrationNavigationProvider.tsx` - Navigation context provider
    - [ ] Navigation stack management
    - [ ] Context preservation across page transitions
    - [ ] Breadcrumb generation
    - [ ] Integration with existing navigation
  - [ ] `VisitTransitionGuard.tsx` - Navigation guard for visit transitions
    - [ ] Active visit detection and management
    - [ ] Visit creation prompts
    - [ ] User confirmation for navigation
    - [ ] Error handling for transition failures

- [ ] **Enhanced Patient Workflows**

  - [ ] `PatientWorkflowPage.tsx` - Unified workflow page
    - [ ] Mode support: 'create' | 'edit' | 'visit'
    - [ ] Dynamic workflow based on mode
    - [ ] Context-aware navigation
    - [ ] Integration with existing clinical workflows
  - [ ] Enhanced `EditPatientForm.tsx` with visit integration
    - [ ] "Start Visit" button with visit creation wizard
    - [ ] Active visit display if exists
    - [ ] Visit history display
    - [ ] Quick visit creation for common visit types

- [ ] **Visit Integration Types**

  - [ ] `src/types/registration/visit.ts` - Visit-related interfaces
    - [ ] `Visit` interface with patient, visitType, provider, status
    - [ ] `VisitType` interface with name, description, retired
    - [ ] `CreateVisitFromPatientRequest` interface
    - [ ] `VisitValidationResult` interface
    - [ ] `RegistrationContext` interface for context preservation

- [ ] **Routing Integration**
  - [ ] Enhanced registration routes with visit integration
    - [ ] `/registration/patient/:uuid/visit/new` - Visit creation route
    - [ ] `/registration/workflow/:mode/:uuid?` - Unified workflow route
  - [ ] Deep linking support for visit creation
  - [ ] URL parameter handling for patient context
  - [ ] Browser history integration

### Phase 6 Action Items

- [ ] **Week 1 (Days 1-5)**

  - [ ] Day 1: Create visit integration types and service interfaces
  - [ ] Day 2: Implement visit integration service layer
  - [ ] Day 3: Build visit creation wizard components
  - [ ] Day 4: Develop visit management hooks
  - [ ] Day 5: Create navigation integration components

- [ ] **Week 2 (Days 6-10)**
  - [ ] Day 6: Enhance existing patient workflows with visit integration
  - [ ] Day 7: Implement comprehensive testing suite
  - [ ] Day 8: Create integration tests and documentation
  - [ ] Day 9: Add configuration and customization options
  - [ ] Day 10: Final testing, optimization, and documentation updates

### Phase 6 Testing Requirements

- [ ] **Unit Tests (25+ tests)**

  - [ ] Visit creation wizard components (8 tests)
  - [ ] Visit management hooks (6 tests)
  - [ ] Navigation integration (5 tests)
  - [ ] Service layer methods (6 tests)

- [ ] **Integration Tests (10+ tests)**

  - [ ] Complete patient-to-visit workflow (4 tests)
  - [ ] Navigation transition scenarios (3 tests)
  - [ ] Error handling and recovery (3 tests)

- [ ] **User Experience Tests**
  - [ ] Workflow completion time benchmarks
  - [ ] Navigation intuitiveness testing
  - [ ] Error recovery path validation

### Phase 6 Completion Criteria

- [ ] **Functional Requirements**

  - [ ] Visit creation from patient context working end-to-end
  - [ ] Navigation between registration and clinical modules seamless
  - [ ] Context preservation across module transitions
  - [ ] Active visit detection and management
  - [ ] Provider and visit type selection functional

- [ ] **Technical Requirements**

  - [ ] All unit tests passing (>90% coverage)
  - [ ] Integration tests covering critical workflows
  - [ ] Performance targets met (<2s navigation transitions)
  - [ ] Error handling comprehensive
  - [ ] Documentation complete and accurate

- [ ] **User Experience Requirements**

  - [ ] Intuitive workflow progression
  - [ ] Clear navigation indicators
  - [ ] Helpful error messages and recovery paths
  - [ ] Responsive design for all form factors
  - [ ] Accessibility compliance maintained

- [ ] **Integration Requirements**
  - [ ] Existing clinical module compatibility
  - [ ] Visit data consistency with OpenMRS standards
  - [ ] Proper authentication and authorization
  - [ ] Context preservation working reliably

### Phase 6 Success Metrics

- **Performance Targets**: Visit creation <30s, Navigation transitions <2s
- **User Experience**: >95% workflow completion, >90% navigation satisfaction
- **Technical**: >90% test coverage, <2% error rate
- **Integration**: 100% context preservation reliability

---

## Phase 7: Advanced Features & Configuration Management (Week 13-14)

**Status**: ⏳ Not Started
**Objective**: Implement advanced functionality and create a flexible configuration system for customization and feature management.

### Phase 7 Deliverables

- [ ] **Advanced Search Features**

  - [ ] `AdvancedSearchManager.tsx` - Saved queries and history
  - [ ] `SavedSearchesPanel.tsx` - CRUD for saved searches
  - [ ] `SearchHistoryPanel.tsx` - History tracking
  - [ ] `BulkOperationsPanel.tsx` - Bulk actions on search results

- [ ] **Export & Reporting Features**

  - [ ] `exportService.ts` - Export patient data, search results
  - [ ] `ExportWizard.tsx` - Multi-step export UI
  - [ ] `ReportGenerator.tsx` - Custom report builder

- [ ] **Configuration Management System**

  - [ ] `configurationService.ts` - Feature flags, form/workflow config
  - [ ] `ConfigurationManager.tsx` - Admin UI for configuration
  - [ ] `FeatureFlagManager.tsx` - UI for managing feature flags

- [ ] **Advanced UI Components**

  - [ ] `DataVisualizationPanel.tsx` - Registration analytics charts
  - [ ] `AdvancedFilterPanel.tsx` - Custom filter builder
  - [ ] `QuickActionsToolbar.tsx` - Customizable toolbar for power users
  - [ ] `PatientDuplicateDetector.tsx` - Duplicate detection and merge UI

- [ ] **User Experience Enhancements**

  - [ ] `NotificationCenter.tsx` - Centralized notifications
  - [ ] `UserPreferencesManager.tsx` - UI for user preferences
  - [ ] `HelpSystem.tsx` - Integrated help and tutorials

- [ ] **Analytics & Reporting**

  - [ ] `analyticsService.ts` - Track user behavior and system analytics
  - [ ] `AnalyticsDashboard.tsx` - Admin dashboard for analytics

- [ ] **Mobile & Responsive Enhancements**
  - [ ] `MobileOptimizedSearch.tsx` - Touch-friendly search
  - [ ] `MobilePatientCard.tsx` - Swipe actions and compact view

### Phase 7 Action Items

- [ ] **Week 1 (Days 1-5)**

  - [ ] Day 1: Implement advanced search features (saved queries, history)
  - [ ] Day 2: Build bulk operations functionality
  - [ ] Day 3: Create export services and basic reporting
  - [ ] Day 4: Extend export functionality and report generation
  - [ ] Day 5: Implement configuration management system core

- [ ] **Week 2 (Days 6-10)**
  - [ ] Day 6: Complete configuration management with feature flags
  - [ ] Day 7: Develop advanced UI components (filtering, visualizations)
  - [ ] Day 8: Create user experience enhancements
  - [ ] Day 9: Implement analytics and reporting dashboard
  - [ ] Day 10: Build mobile optimizations and final testing

### Phase 7 Testing Requirements

- [ ] **Unit Tests (25+ tests)**

  - [ ] Advanced search components (8 tests)
  - [ ] Export and reporting services (6 tests)
  - [ ] Configuration management (6 tests)
  - [ ] Advanced UI components (3 tests)
  - [ ] Mobile optimization components (2 tests)

- [ ] **Integration Tests (12+ tests)**

  - [ ] End-to-end advanced search workflows (4 tests)
  - [ ] Bulk operations integration (3 tests)
  - [ ] Export functionality integration (3 tests)
  - [ ] Configuration management integration (2 tests)

- [ ] **User Experience Tests (8+ tests)**
  - [ ] Mobile interface testing (3 tests)
  - [ ] Accessibility compliance testing (3 tests)
  - [ ] Configuration workflow testing (2 tests)

### Phase 7 Completion Criteria

- [ ] **Functional Requirements**

  - [ ] Advanced search features working with saved queries and history
  - [ ] Bulk operations functional for patient management
  - [ ] Export functionality supporting multiple formats
  - [ ] Configuration management system operational
  - [ ] Mobile-optimized interface functional

- [ ] **Technical Requirements**

  - [ ] All unit tests passing (>90% coverage)
  - [ ] Integration tests covering critical workflows
  - [ ] Configuration system flexible and extensible
  - [ ] Export system handling large datasets
  - [ ] Analytics system capturing user behavior

- [ ] **User Experience Requirements**
  - [ ] Advanced features intuitive and discoverable
  - [ ] Mobile experience optimized for touch interactions
  - [ ] Accessibility compliance maintained across all features
  - [ ] Configuration options easily accessible to administrators
  - [ ] Help system providing contextual guidance

---

## Success Metrics Dashboard

### Technical Metrics

- **Code Coverage**: Target >90%
- **Performance**: Target <2s load, <500ms interactions
- **Accessibility**: Target 100% WCAG 2.1 AA compliance
- **Bundle Size**: Target <500KB gzipped
- **Error Rate**: Target <1% client-side errors

### Development Metrics

- **Test Count**: Target 200+ tests total
- **Component Count**: Target 25+ components
- **Hook Count**: Target 8+ custom hooks
- **Type Safety**: 100% TypeScript coverage

### User Experience Metrics

- **Task Completion**: Target >95% success rate
- **Training Time**: Target <2 hours for existing users
- **Error Recovery**: Clear paths for all error scenarios
- **Mobile Usability**: Functional on tablet devices

---

## Risk Mitigation & Contingency Plans

### Technical Risks

- **Performance Issues**: Implement progressive enhancement
- **Browser Compatibility**: Maintain fallback strategies
- **API Changes**: Abstract service layer for flexibility
- **Data Migration**: Comprehensive backup and testing

### Project Risks

- **Timeline Delays**: Prioritize core functionality first
- **Resource Constraints**: Focus on MVP features
- **User Resistance**: Provide comprehensive training
- **Integration Issues**: Maintain backward compatibility

---

## Next Steps

### Immediate Actions (This Week)

1. **Environment Setup**: Configure development environment
2. **Knowledge Review**: Deep dive into Neo4j knowledge graph data
3. **Legacy Analysis**: Analyze existing AngularJS registration code
4. **Architecture Finalization**: Confirm technical approach

### Phase 1 Kickoff (Next Week)

1. **Team Alignment**: Review detailed plans with team
2. **Development Start**: Begin TypeScript interface development
3. **Service Implementation**: Start core service layer
4. **Testing Setup**: Establish testing infrastructure

### Weekly Reviews

- **Progress Assessment**: Track deliverable completion
- **Risk Review**: Identify and mitigate emerging risks
- **Quality Gates**: Ensure standards compliance
- **Stakeholder Updates**: Regular progress communication

This comprehensive progress tracking ensures accountability, visibility, and successful delivery of the registration module migration project.
