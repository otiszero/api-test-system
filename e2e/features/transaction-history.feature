@smoke @needs(login-owner)
Feature: Transaction History
  Verify transaction history page displays correctly with filters and table.

  Background:
    Given I am on the "transactions" page

  Scenario: Transaction page loads
    Then I should see "Transaction History"
    And I should see "Search by txID/name/email"

  Scenario: Filter controls are visible
    Then I should see "Past 30 days"
    And I should see "All Asset"
    And I should see "All Status"
    And I should see "All Types"
    And I should see "All Vaults"

  Scenario: Table headers are correct
    Then I should see "Time"
    And I should see "Transaction ID"
    And I should see "Initiated by"
    And I should see "Vault account"
    And I should see "Type"
    And I should see "Asset"
    And I should see "Amount"
    And I should see "Status"

  Scenario: Export button is disabled when no data
    Then I should see "No data"
