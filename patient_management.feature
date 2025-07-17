Feature: Patient Management
  As a healthcare worker
  I want to edit and manage existing patient information
  So that I can keep patient records up-to-date and accurate

  Background:
    Given I am logged in as a user with "Edit Patients" privilege
    And the following patient exists in the system:
      | identifier | givenName | familyName | gender | birthdate  | phoneNumber | address        |
      | GAN200001  | John      | Doe        | Male   | 01/01/1988 | +1234567890 | New York, USA  |
    And I am on the patient edit page for patient "GAN200001"

  @patient-management @positive
  Scenario: Edit patient basic information
    Given I want to update patient information
    When I modify the following fields:
      | field       | newValue      |
      | givenName   | Jonathan      |
      | phoneNumber | +1987654321   |
      | address1    | 456 Oak St    |
    And I click "Save"
    Then the patient information should be updated successfully
    And I should see the message "Patient saved successfully"
    And the updated information should be displayed correctly

  @patient-management @positive
  Scenario: Edit patient address using hierarchy
    Given the address hierarchy is configured
    When I update the patient address:
      | level    | value        |
      | Country  | India        |
      | State    | Karnataka    |
      | District | Bangalore    |
      | Village  | Koramangala  |
    And I click "Save"
    Then the patient address should be updated with the hierarchy
    And the address should be validated against the configured hierarchy

  @patient-management @positive
  Scenario: Update patient photo
    Given I want to update the patient's photo
    When I click "Upload Photo"
    And I select a new image file
    And I click "Save"
    Then the patient photo should be updated
    And the new photo should be displayed in the patient details

  @patient-management @positive
  Scenario: Add patient relationship
    Given I want to add a new relationship for the patient
    When I click "Add Relationship"
    And I fill in the relationship details:
      | relationshipType | personName | gender | age | phoneNumber |
      | Spouse           | Jane Doe   | Female | 30  | +1234567891 |
    And I click "Save"
    Then the new relationship should be added to the patient
    And I should see the relationship in the patient's relationship list

  @patient-management @positive
  Scenario: Edit existing patient relationship
    Given the patient has an existing relationship:
      | relationshipType | personName | gender | age |
      | Parent/Child     | Mary Doe   | Female | 60  |
    When I edit the relationship to:
      | relationshipType | personName | gender | age |
      | Parent/Child     | Mary Smith | Female | 62  |
    And I click "Save"
    Then the relationship should be updated
    And the updated relationship should be displayed correctly

  @patient-management @positive
  Scenario: Delete patient relationship
    Given the patient has an existing relationship:
      | relationshipType | personName | gender | age |
      | Sibling          | Bob Doe    | Male   | 40  |
    When I click "Delete" for the relationship
    And I confirm the deletion
    And I click "Save"
    Then the relationship should be removed from the patient
    And the relationship should not appear in the patient's relationship list

  @patient-management @positive
  Scenario: Update patient custom attributes
    Given the system has custom attributes configured:
      | attribute  | type   | values                    |
      | caste      | String | General, OBC, SC, ST      |
      | education  | Coded  | Primary, Secondary, Graduate |
      | occupation | Coded  | Farmer, Teacher, Doctor   |
    When I update the custom attributes:
      | attribute  | value     |
      | caste      | OBC       |
      | education  | Graduate  |
      | occupation | Teacher   |
    And I click "Save"
    Then the custom attributes should be updated
    And the new values should be displayed correctly

  @patient-management @validation
  Scenario: Validation for mandatory fields during edit
    Given I am editing patient information
    When I clear the "givenName" field
    And I click "Save"
    Then I should see a validation error "Given name is required"
    And the patient information should not be saved

  @patient-management @validation
  Scenario: Validation for invalid phone number format
    Given I am editing patient information
    When I enter "123" in the phone number field
    And I click "Save"
    Then I should see a validation error "Phone number must be at least 8 digits"
    And the patient information should not be saved

  @patient-management @validation
  Scenario: Validation for future birthdate
    Given I am editing patient information
    When I change the birthdate to "01/01/2030"
    And I click "Save"
    Then I should see a validation error "Birthdate cannot be in the future"
    And the patient information should not be saved

  @patient-management @readonly
  Scenario: Read-only fields cannot be edited
    Given the system has read-only fields configured for "identifier"
    When I try to edit the patient identifier
    Then the identifier field should be disabled
    And I should not be able to modify the identifier value

  @patient-management @negative
  Scenario: Edit patient without sufficient privileges
    Given I am logged in as a user without "Edit Patients" privilege
    When I try to access the patient edit page
    Then I should see an error "Insufficient privileges to edit patients"
    And I should be redirected to the patient view page

  @patient-management @death-information
  Scenario: Mark patient as deceased
    Given I want to mark the patient as deceased
    When I check the "Patient is dead" checkbox
    And I enter the death date as "15/12/2023"
    And I select "Natural causes" as the cause of death
    And I click "Save"
    Then the patient should be marked as deceased
    And the death information should be saved
    And the patient status should show as "Deceased"

  @patient-management @death-information
  Scenario: Update death information
    Given the patient is already marked as deceased
    When I update the death date to "20/12/2023"
    And I change the cause of death to "Accident"
    And I click "Save"
    Then the death information should be updated
    And the new death details should be displayed

  @patient-management @death-information
  Scenario: Unmark patient as deceased
    Given the patient is marked as deceased
    When I uncheck the "Patient is dead" checkbox
    And I click "Save"
    Then the patient should be marked as alive
    And the death information should be cleared
    And the patient status should show as "Active"

  @patient-management @identifiers
  Scenario: Add additional patient identifier
    Given the system supports multiple identifier types
    When I click "Add Identifier"
    And I select identifier type "National ID"
    And I enter "NAT123456789" as the identifier value
    And I click "Save"
    Then the new identifier should be added to the patient
    And both identifiers should be displayed in patient details

  @patient-management @identifiers
  Scenario: Edit existing patient identifier
    Given the patient has multiple identifiers
    When I edit the secondary identifier from "OLD123" to "NEW456"
    And I click "Save"
    Then the identifier should be updated
    And the new identifier value should be displayed

  @patient-management @whatsapp
  Scenario: Send WhatsApp notification to updated patient
    Given WhatsApp integration is enabled
    And the patient has a valid phone number
    When I click "Send WhatsApp Message"
    Then a WhatsApp message should be composed with updated patient details
    And the message should include:
      | element        | value                    |
      | patientName    | Current patient name     |
      | identifier     | Current patient ID       |
      | clinicName     | Current facility name    |
      | contactInfo    | Help desk information    |

  @patient-management @integration
  Scenario: Edit patient and create visit
    Given I have updated patient information
    When I click "Create Visit"
    Then I should be redirected to the visit creation page
    And the updated patient information should be available
    And I should be able to create a visit with the current patient data

  @patient-management @integration
  Scenario: Edit patient and print updated registration card
    Given I have updated patient information
    When I click "Print Registration Card"
    Then a print dialog should open
    And the registration card should contain the updated information:
      | element          | value                    |
      | patientName      | Updated patient name     |
      | identifier       | Current patient ID       |
      | age              | Current calculated age   |
      | address          | Updated address          |
      | phoneNumber      | Updated phone number     |

  @patient-management @audit
  Scenario: Patient edit creates audit log
    Given audit logging is enabled
    When I update patient information
    And I click "Save"
    Then an audit log entry should be created
    And the audit log should contain:
      | field           | value                    |
      | action          | Patient Edit             |
      | patientUuid     | Patient's UUID           |
      | userId          | Current user ID          |
      | timestamp       | Current timestamp        |
      | module          | Registration             |

  @patient-management @concurrent-edit
  Scenario: Handle concurrent patient edits
    Given another user is editing the same patient
    When I try to save my changes
    Then I should see a warning about concurrent edits
    And I should be given options to:
      | option                    | description                           |
      | Overwrite changes         | Save my changes, discarding others    |
      | Reload and retry          | Reload patient data and try again     |
      | Cancel                    | Cancel my changes                     |

  @patient-management @data-validation
  Scenario: Validate patient data consistency
    Given I am editing patient information
    When I enter inconsistent data:
      | field     | value      | issue                    |
      | birthdate | 01/01/2020 | Age doesn't match        |
      | gender    | Female     | Name suggests male       |
    And I click "Save"
    Then I should see data consistency warnings
    And I should be able to confirm or correct the data

  @patient-management @bulk-operations
  Scenario: Bulk update patient attributes
    Given I have selected multiple patients for bulk update
    When I choose to update the "caste" attribute to "General"
    And I confirm the bulk update
    Then all selected patients should have their caste updated
    And I should see a confirmation of the number of patients updated

  @patient-management @search-integration
  Scenario: Edit patient from search results
    Given I have searched for and found a patient
    When I click "Edit" from the search results
    Then I should be taken to the patient edit page
    And all patient information should be loaded correctly
    And I should be able to make changes and save them
