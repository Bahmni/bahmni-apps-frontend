Feature: Patient Registration
  As a healthcare worker
  I want to register new patients
  So that I can maintain accurate patient records in the system

  Background:
    Given I am logged in as a user with "Add Patients" privilege
    And I am on the new patient registration page
    And the system is configured with:
      | setting                    | value                           |
      | defaultIdentifierPrefix    | GAN                            |
      | mandatoryPersonAttributes  | givenName, familyName, gender  |
      | addressHierarchy          | country, state, district, city  |

  @registration @positive
  Scenario: Register a new patient with mandatory fields
    Given I want to register a new patient
    When I fill in the following patient details:
      | field      | value    |
      | givenName  | John     |
      | familyName | Doe      |
      | gender     | Male     |
      | birthdate  | 01/01/1988 |
    And I click "Save"
    Then the patient should be successfully registered
    And I should see the message "Patient saved successfully"
    And I should be redirected to the patient edit page
    And the patient should have a generated identifier starting with "GAN"

  @registration @positive
  Scenario: Register patient with all optional fields
    Given I want to register a new patient with complete information
    When I fill in the following patient details:
      | field           | value           |
      | givenName       | Jane            |
      | middleName      | Marie           |
      | familyName      | Smith           |
      | gender          | Female          |
      | birthdate       | 15/03/1990      |
      | phoneNumber     | +1234567890     |
      | address1        | 123 Main St     |
      | cityVillage     | New York        |
      | stateProvince   | NY              |
      | country         | USA             |
      | caste           | General         |
      | education       | Graduate        |
      | occupation      | Teacher         |
    And I upload a patient photo
    And I click "Save"
    Then the patient should be successfully registered
    And all the entered information should be saved correctly
    And the patient photo should be associated with the patient

  @registration @positive
  Scenario: Register patient with age instead of birthdate
    Given I want to register a patient using age
    When I fill in the following patient details:
      | field      | value  |
      | givenName  | Ram    |
      | familyName | Kumar  |
      | gender     | Male   |
      | ageYears   | 35     |
      | ageMonths  | 6      |
    And I click "Save"
    Then the patient should be successfully registered
    And the birthdate should be calculated from the age
    And the birthdate should be marked as estimated

  @registration @positive
  Scenario: Register patient with custom identifier
    Given the system allows custom identifiers
    And I want to register a patient with a specific identifier
    When I check "Enter ID" option
    And I enter "CUSTOM001" as the patient identifier
    And I fill in the mandatory patient details:
      | field      | value  |
      | givenName  | Test   |
      | familyName | User   |
      | gender     | Male   |
      | birthdate  | 01/01/1985 |
    And I click "Save"
    Then the patient should be registered with identifier "CUSTOM001"

  @registration @validation
  Scenario: Validation for mandatory fields
    Given I am on the new patient registration page
    When I click "Save" without filling any fields
    Then I should see validation errors for:
      | field      | error                        |
      | givenName  | Given name is required       |
      | familyName | Family name is required      |
      | gender     | Gender is required           |
    And the patient should not be saved

  @registration @validation
  Scenario: Validation for invalid birthdate
    Given I want to register a patient
    When I fill in the following patient details:
      | field      | value      |
      | givenName  | John       |
      | familyName | Doe        |
      | gender     | Male       |
      | birthdate  | 01/01/2030 |
    And I click "Save"
    Then I should see an error "Birthdate cannot be in the future"
    And the patient should not be saved

  @registration @validation
  Scenario: Validation for invalid age
    Given I want to register a patient using age
    When I fill in the following patient details:
      | field      | value |
      | givenName  | John  |
      | familyName | Doe   |
      | gender     | Male  |
      | ageYears   | 150   |
    And I click "Save"
    Then I should see an error "Age cannot be more than 120 years"
    And the patient should not be saved

  @registration @validation
  Scenario: Validation for phone number format
    Given the system has phone number validation configured
    When I fill in valid patient details
    And I enter "123" as the phone number
    And I click "Save"
    Then I should see an error "Phone number must be at least 8 digits"
    And the patient should not be saved

  @registration @negative
  Scenario: Register patient with duplicate identifier
    Given a patient with identifier "GAN200001" already exists
    When I try to register a new patient with identifier "GAN200001"
    And I fill in other mandatory details
    And I click "Save"
    Then I should see an error "Patient identifier already exists"
    And the patient should not be saved

  @registration @negative
  Scenario: Register patient without sufficient privileges
    Given I am logged in as a user without "Add Patients" privilege
    When I try to access the new patient registration page
    Then I should see an error "Insufficient privileges to add patients"
    And I should be redirected to the search page

  @registration @relationships
  Scenario: Register patient with relationships
    Given I want to register a patient with family relationships
    When I fill in the mandatory patient details
    And I add a relationship:
      | relationshipType | personName | gender | age |
      | Parent/Child     | John Doe   | Male   | 60  |
    And I click "Save"
    Then the patient should be successfully registered
    And the relationship should be created
    And I should be able to see the relationship in patient details

  @registration @address-hierarchy
  Scenario: Register patient with hierarchical address
    Given the address hierarchy is configured as "Country > State > District > Village"
    When I fill in the mandatory patient details
    And I select the following address:
      | level    | value        |
      | Country  | India        |
      | State    | Maharashtra  |
      | District | Pune         |
      | Village  | Kothrud      |
    And I click "Save"
    Then the patient should be registered with the complete address hierarchy
    And the address should be validated against the hierarchy

  @registration @photo-capture
  Scenario: Register patient with photo capture
    Given the photo capture feature is enabled
    When I fill in the mandatory patient details
    And I click "Capture Photo"
    And I take a photo using the camera
    And I confirm the captured photo
    And I click "Save"
    Then the patient should be registered with the captured photo
    And the photo should be displayed in patient details

  @registration @photo-upload
  Scenario: Register patient with photo upload
    Given the photo upload feature is enabled
    When I fill in the mandatory patient details
    And I click "Upload Photo"
    And I select a valid image file
    And I click "Save"
    Then the patient should be registered with the uploaded photo
    And the photo should be displayed in patient details

  @registration @defaults
  Scenario: Register patient with default values
    Given the system has default values configured:
      | field      | defaultValue |
      | caste      | General      |
      | education  | Primary      |
    When I fill in only the mandatory patient details
    And I click "Save"
    Then the patient should be registered with default values applied
    And the caste should be set to "General"
    And the education should be set to "Primary"

  @registration @identifier-sequence
  Scenario: Register patient with identifier sequence jump
    Given the next identifier in sequence is "GAN200005"
    But I want to register a patient with identifier "GAN200010"
    When I enter "GAN200010" as the custom identifier
    And I fill in other mandatory details
    And I click "Save"
    Then I should see a confirmation dialog about identifier sequence jump
    When I confirm the sequence jump
    Then the patient should be registered with identifier "GAN200010"

  @registration @integration
  Scenario: Register patient and create visit
    Given I have successfully registered a new patient
    When I click "Create Visit" from the patient page
    Then I should be redirected to the visit creation page
    And the patient information should be pre-populated
    And I should be able to create a visit for the patient

  @registration @integration
  Scenario: Register patient and print registration card
    Given I have successfully registered a new patient
    When I click "Print Registration Card"
    Then a print dialog should open
    And the registration card should contain:
      | element          | value                    |
      | patientName      | John Doe                 |
      | identifier       | GAN200001               |
      | age              | 35 years                |
      | gender           | Male                    |
      | registrationDate | Today's date            |
      | clinicName       | Current facility name   |

  @registration @whatsapp
  Scenario: Register patient and send WhatsApp notification
    Given WhatsApp integration is enabled
    And I have registered a patient with phone number "+1234567890"
    When I click "Send WhatsApp Message"
    Then a WhatsApp message should be composed with:
      | element        | value                           |
      | phoneNumber    | +1234567890                    |
      | message        | Registration confirmation text  |
      | patientDetails | Name, ID, age, gender          |
    And the WhatsApp application should open with the pre-filled message
