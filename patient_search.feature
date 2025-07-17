Feature: Patient Search
  As a healthcare worker
  I want to search for patients using various criteria
  So that I can quickly find and access patient information

  Background:
    Given I am logged in as a user with "View Patients" privilege
    And I am on the patient search page
    And the system has the following patients:
      | identifier | firstName | lastName | gender | age | address        | phoneNumber  |
      | GAN200001  | John      | Doe      | M      | 35  | New York, USA  | +1234567890  |
      | GAN200002  | Jane      | Smith    | F      | 28  | London, UK     | +4412345678  |
      | GAN200003  | Ram       | Kumar    | M      | 45  | Delhi, India   | +919876543210|

  @search @positive
  Scenario: Search patient by identifier
    Given I have a valid patient identifier "GAN200001"
    When I enter "GAN200001" in the patient identifier search field
    And I click the search button
    Then I should be redirected to the patient details page
    And I should see patient "John Doe" information

  @search @positive
  Scenario: Search patient by partial name
    Given I want to search for a patient by name
    When I enter "John" in the name search field
    And I click the search button
    Then I should see search results containing:
      | identifier | name     | gender | age |
      | GAN200001  | John Doe | M      | 35  |

  @search @positive
  Scenario: Search patient by full name
    Given I want to search for a patient by full name
    When I enter "Jane Smith" in the name search field
    And I click the search button
    Then I should see search results containing:
      | identifier | name       | gender | age |
      | GAN200002  | Jane Smith | F      | 28  |

  @search @positive
  Scenario: Search patient by address
    Given the address search is configured for "cityVillage" field
    When I enter "Delhi" in the address search field
    And I click the search button
    Then I should see search results containing:
      | identifier | name      | address      |
      | GAN200003  | Ram Kumar | Delhi, India |

  @search @positive
  Scenario: Search with multiple criteria
    Given I want to search using multiple criteria
    When I enter "John" in the name search field
    And I enter "New York" in the address search field
    And I click the search button
    Then I should see search results containing:
      | identifier | name     | address       |
      | GAN200001  | John Doe | New York, USA |

  @search @positive
  Scenario: Search results pagination
    Given there are more than 20 patients in the system
    When I perform a search that returns more than 20 results
    Then I should see the first 20 results
    And I should see a "Load More" button
    When I click "Load More"
    Then I should see additional results appended to the list

  @search @negative
  Scenario: Search with no results
    Given I want to search for a non-existent patient
    When I enter "NonExistentPatient" in the name search field
    And I click the search button
    Then I should see the message "No patients found"
    And I should see an option to create a new patient

  @search @negative
  Scenario: Search without sufficient privileges
    Given I am logged in as a user without "View Patients" privilege
    When I try to search for a patient
    Then I should see an error message "Insufficient privileges to search patients"
    And the search should not be performed

  @search @negative
  Scenario: Search with empty criteria
    Given I am on the patient search page
    When I click the search button without entering any search criteria
    Then the search button should be disabled
    And no search should be performed

  @search @edge-case
  Scenario: Search by identifier with multiple matches
    Given there are multiple patients with similar identifiers
    When I search by identifier "GAN200001"
    Then I should see all matching patients in the results
    And I should be able to select the correct patient

  @search @integration
  Scenario: Search and navigate to patient edit
    Given I have searched for and found a patient
    When I click on the "Edit" action for patient "John Doe"
    Then I should be redirected to the patient edit page
    And I should see the patient's editable information

  @search @integration
  Scenario: Search and print patient information
    Given I have searched for and found a patient
    When I click on the "Print" action for patient "John Doe"
    Then a print dialog should open
    And the patient's registration card should be formatted for printing

  @search @custom-attributes
  Scenario: Search by custom attributes
    Given custom attribute search is configured for "caste" field
    When I enter "General" in the custom attribute search field
    And I click the search button
    Then I should see all patients with caste "General"

  @search @program-attributes
  Scenario: Search by program attributes
    Given program attribute search is configured for "program" field
    When I enter "HIV Program" in the program attribute search field
    And I click the search button
    Then I should see all patients enrolled in "HIV Program"

  @search @performance
  Scenario: Search response time
    Given I am searching for a patient
    When I perform any search operation
    Then the search results should be displayed within 3 seconds
    And a loading indicator should be shown during the search
