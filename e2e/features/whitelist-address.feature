@smoke @needs(login-owner)
Feature: Whitelist Address
  Verify whitelist address management page and create wallet flow.

  Background:
    Given I am on the "whitelist-address" page

  Scenario: Whitelist page loads
    Then I should see "Whitelist Address"
    And I should see "Search by wallet name"

  Scenario: Create wallet button is visible
    Then I should see "Create wallet"

  Scenario: Table headers are correct
    Then I should see "Wallet Name"
    And I should see "Asset"
    And I should see "Action"
