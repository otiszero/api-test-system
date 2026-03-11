@smoke @needs(login-owner)
Feature: Action Log
  Verify action log page with filters, role selector, and audit trail.

  Background:
    Given I am on the "action-log" page

  Scenario: Action Log page loads
    Then I should see "Action Log"
    And I should see "Enter actor, service or details"

  Scenario: Filter controls are visible
    Then I should see "Past 30 days"
    And I should see "All Roles"
    And I should see "Export"

  Scenario: Table headers are correct
    Then I should see "Timestamp"
    And I should see "Actor"
    And I should see "Role"
    And I should see "Service"
    And I should see "Details"

  Scenario: Login action is logged
    Then I should see "User logged in"
    And I should see "AuthService"
