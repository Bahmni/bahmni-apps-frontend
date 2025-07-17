Feature: Integration and Workflows
  As a healthcare worker
  I want to perform complete patient registration workflows
  So that I can efficiently manage patient care from registration to clinical services

  Background:
    Given I am logged in as a user with full registration privileges
    And the system is configured with:
      | setting                | value                    |
      | defaultIdentifierPrefix| GAN                     |
      | enableWhatsAppButton   | true                    |
      | enableDashboardRedirect| true                    |
      | dashboardUrl          | /clinical/patient/{{patientUuid}}/dashboard |

  @integration @end-to-end
  Scenario: Complete patient registration to clinical workflow
    Given I want to register a new patient and start clinical care
    When I search for patient "John Doe" and find no results
    And I click "Create New Patient"
    And I fill in the patient registration form:
      | field       | value           |
      | givenName   | John            |
      | familyName  | Doe             |
      | gender      | Male            |
      | birthdate   | 01/01/1988      |
      | phoneNumber | +1234567890     |
      | address1    | 123 Main St     |
      | cityVillage | New York        |
    And I capture a patient photo
    And I save the patient
    Then the patient should be registered successfully
    When I click "Create Visit"
    And I select visit type "OPD"
    And I fill in vital signs:
      | concept     | value |
      | Height      | 175   |
      | Weight      | 70    |
      | Temperature | 98.6  |
      | Pulse       | 72    |
    And I start the visit
    Then the visit should be created successfully
    When I click "Go to Clinical"
    Then I should be redirected to the clinical dashboard
    And the patient and visit context should be maintained

  @integration @search-to-edit
  Scenario: Search patient and update information workflow
    Given a patient "GAN200001" exists with basic information
    When I search for patient by identifier "GAN200001"
    Then I should be redirected to the patient details page
    When I click "Edit Patient"
    And I update the patient information:
      | field       | newValue        |
      | phoneNumber | +1987654321     |
      | address1    | 456 Oak Street  |
    And I add a new relationship:
      | relationshipType | personName | gender | age |
      | Spouse           | Jane Doe   | Female | 30  |
    And I save the changes
    Then the patient information should be updated
    And the new relationship should be created
    When I click "Send WhatsApp Message"
    Then a WhatsApp message should be composed with updated patient details

  @integration @multi-identifier
  Scenario: Patient with multiple identifiers workflow
    Given I am registering a patient with multiple identifier types
    When I fill in the basic patient information
    And I add additional identifiers:
      | identifierType | value       |
      | National ID    | NAT12345678 |
      | Aadhaar        | 123456789012|
    And I save the patient
    Then the patient should be registered with all identifiers
    When I search by any of the identifiers
    Then I should find the same patient
    And all identifiers should be displayed in search results

  @integration @family-registration
  Scenario: Register multiple family members workflow
    Given I have registered the head of family "John Doe"
    When I register his spouse with relationship:
      | givenName      | Jane            |
      | familyName     | Doe             |
      | gender         | Female          |
      | relationshipTo | John Doe        |
      | relationship   | Spouse          |
    And I register their child with relationship:
      | givenName      | Johnny          |
      | familyName     | Doe             |
      | gender         | Male            |
      | age            | 10              |
      | relationshipTo | John Doe        |
      | relationship   | Parent/Child    |
    Then all family members should be registered
    And the relationships should be established bidirectionally
    When I view any family member's details
    Then I should see all family relationships
    And I should be able to navigate between family members

  @integration @visit-continuity
  Scenario: Patient visit continuity across sessions
    Given a patient "GAN200001" has an active visit
    When I log out and log back in
    And I search for the patient
    Then I should see the patient has an active visit
    When I click "Continue Visit"
    Then I should be taken to the active visit
    And all previous visit data should be available
    And I should be able to add new observations

  @integration @printing-workflow
  Scenario: Complete printing workflow
    Given I have registered a patient "John Doe"
    When I click "Print Registration Card"
    Then a print dialog should open with registration card
    When I print the registration card
    And I create a visit for the patient
    And I click "Print Visit Receipt"
    Then a print dialog should open with visit receipt
    And both documents should contain consistent patient information

  @integration @photo-management
  Scenario: Patient photo management workflow
    Given I am registering a new patient
    When I capture a photo using the camera
    And I save the patient with the photo
    Then the patient should be registered with the photo
    When I edit the patient later
    And I upload a new photo file
    And I save the changes
    Then the patient photo should be updated
    And the new photo should be displayed everywhere

  @integration @address-hierarchy
  Scenario: Complete address hierarchy workflow
    Given the address hierarchy is configured as "Country > State > District > Village"
    When I register a patient and select:
      | level    | value        |
      | Country  | India        |
      | State    | Maharashtra  |
      | District | Pune         |
      | Village  | Kothrud      |
    And I save the patient
    Then the complete address hierarchy should be saved
    When I search patients by address "Kothrud"
    Then I should find the patient
    When I generate address reports
    Then the patient should appear in the correct hierarchy levels

  @integration @custom-attributes
  Scenario: Custom attributes workflow
    Given the system has custom attributes configured:
      | attribute  | type   | mandatory | values                |
      | caste      | String | true      | General, OBC, SC, ST  |
      | education  | Coded  | false     | Primary, Secondary    |
      | occupation | Coded  | false     | Farmer, Teacher       |
    When I register a patient
    And I fill in custom attributes:
      | attribute  | value     |
      | caste      | General   |
      | education  | Secondary |
      | occupation | Teacher   |
    And I save the patient
    Then all custom attributes should be saved
    When I search patients by custom attribute "caste = General"
    Then I should find the patient in results
    When I generate reports by custom attributes
    Then the patient should be included in appropriate categories

  @integration @audit-trail
  Scenario: Complete audit trail workflow
    Given audit logging is enabled
    When I perform the following sequence:
      | action           | details                    |
      | Search Patient   | Search by name "John"      |
      | Create Patient   | Register John Doe          |
      | Edit Patient     | Update phone number        |
      | Create Visit     | Start OPD visit            |
      | Print Card       | Print registration card    |
    Then each action should create an audit log entry
    When I view the audit trail for the patient
    Then I should see all actions in chronological order
    And each entry should contain complete details
    And I should be able to track who did what when

  @integration @error-recovery
  Scenario: Error recovery workflow
    Given I am in the middle of patient registration
    When a network error occurs during save
    Then I should see an appropriate error message
    And my entered data should be preserved
    When the network connection is restored
    And I click "Retry"
    Then the patient should be saved successfully
    And no data should be lost

  @integration @concurrent-users
  Scenario: Multiple users working simultaneously
    Given multiple users are working on different patients
    When User A registers Patient 1
    And User B registers Patient 2 simultaneously
    And User C searches for existing patients
    Then all operations should complete successfully
    And there should be no data conflicts
    And each user should see their own work reflected immediately

  @integration @location-based-workflow
  Scenario: Location-based registration workflow
    Given I am logged in at location "OPD"
    When I register a patient
    Then the patient should be associated with "OPD" location
    When I create a visit for the patient
    Then the visit should default to "OPD" location
    When another user at "IPD" location searches
    Then they should not see my "OPD" patients
    But when I search, I should see all my registered patients

  @integration @data-migration
  Scenario: Legacy data integration workflow
    Given the system has legacy patient data
    When I search for a legacy patient by old identifier
    Then I should find the patient with migrated data
    And all legacy information should be properly formatted
    When I edit the legacy patient
    Then I should be able to update with new fields
    And the legacy data should be preserved
    And new data should follow current validation rules

  @integration @backup-recovery
  Scenario: System backup and recovery workflow
    Given I have registered several patients
    When a system backup is performed
    And the system is restored from backup
    Then all patient data should be intact
    And I should be able to search for all patients
    And all relationships and visits should be preserved
    And the system should function normally

  @integration @performance-workflow
  Scenario: High-volume registration workflow
    Given the system needs to handle high patient volume
    When I register 100 patients in quick succession
    Then each registration should complete within acceptable time
    And the system should remain responsive
    And search performance should not degrade
    And all data should be accurately stored

  @integration @mobile-responsive
  Scenario: Mobile device registration workflow
    Given I am accessing the system from a mobile device
    When I perform patient registration tasks
    Then all forms should be mobile-responsive
    And I should be able to complete all registration functions
    And photo capture should work on mobile camera
    And the user experience should be optimized for mobile

  @integration @offline-capability
  Scenario: Offline registration workflow
    Given I am in an area with poor network connectivity
    When I register patients while offline
    Then the data should be stored locally
    When network connectivity is restored
    Then all offline data should sync automatically
    And there should be no data loss
    And conflicts should be resolved appropriately

  @integration @reporting-integration
  Scenario: Registration data reporting workflow
    Given I have registered multiple patients with various attributes
    When I generate registration reports
    Then I should see accurate patient counts by:
      | dimension        | examples                    |
      | Age groups       | 0-18, 19-60, 60+          |
      | Gender           | Male, Female, Other        |
      | Location         | OPD, IPD, Emergency        |
      | Custom attributes| Caste, Education, Occupation|
    And the reports should be exportable
    And data should be consistent across all reports

  @integration @whatsapp-integration
  Scenario: Complete WhatsApp integration workflow
    Given WhatsApp integration is configured
    When I register a patient with phone number
    And I click "Send WhatsApp Message"
    Then WhatsApp should open with pre-filled message containing:
      | element        | value                    |
      | Patient name   | John Doe                 |
      | Patient ID     | GAN200001               |
      | Clinic name    | Current facility         |
      | Help desk      | Configured help number   |
    When I send the message
    Then the patient should receive registration confirmation
    And the message should be logged in the system

  @integration @clinical-handoff
  Scenario: Registration to clinical handoff workflow
    Given I have completed patient registration and visit creation
    When I hand off the patient to clinical staff
    Then the clinical system should have access to:
      | information      | details                    |
      | Patient demographics | Name, age, gender, address |
      | Visit information    | Visit type, date, location |
      | Vital signs         | Height, weight, temperature |
      | Relationships       | Family member details      |
      | Custom attributes   | Caste, education, occupation|
    And the clinical staff should be able to continue care seamlessly
    And all registration data should be available for clinical decision-making
