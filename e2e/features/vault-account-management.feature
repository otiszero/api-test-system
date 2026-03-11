@smoke @needs(login-owner)
Feature: Vault Account Management
  Verify vault account management page and create vault flow.

  Background:
    Given I am on the "vault-account-management" page

  Scenario: Vault Account Management page loads
    Then I should see "Vault Account Management"
    And I should see "Search by vault account name"

  Scenario: Create vault account button is visible
    Then I should see "Create vault account"

  Scenario: Table headers are correct
    Then I should see "Vault account"
    And I should see "Vault balance"
    And I should see "Asset"
    And I should see "Member"
    And I should see "Action"
