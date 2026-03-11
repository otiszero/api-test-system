@smoke @needs(login-owner)
Feature: Member Management
  Verify member management page with filters, invite, and member list.

  Background:
    Given I am on the "members" page

  Scenario: Member Management page loads
    Then I should see "Member Management"
    And I should see "Search by member name or email"

  Scenario: Filter and action controls are visible
    Then I should see "All access"
    And I should see "All Account Status"
    And I should see "Export"
    And I should see "Invite"

  Scenario: Table headers are correct
    Then I should see "Member"
    And I should see "Joined Date"
    And I should see "Access"
    And I should see "Account Status"

  Scenario: Owner account is listed
    Then I should see "Tienkim"
    And I should see "Owner"
    And I should see "Active"
