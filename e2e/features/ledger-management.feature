@smoke @needs(login-owner)
Feature: Ledger Management
  Verify ledger management page with filters and transaction journal.

  Background:
    Given I am on the "ledger" page

  Scenario: Ledger Management page loads
    Then I should see "Ledger Management"
    And I should see "Search by journal id, transaction id, vault account name"

  Scenario: Filter controls are visible
    Then I should see "Past 30 days"
    And I should see "All Asset"

  Scenario: Table headers are correct
    Then I should see "Time"
    And I should see "Wallet Address"
    And I should see "Type"
    And I should see "Journal ID"
    And I should see "Txn ID"
    And I should see "Vault Account Name"
    And I should see "Asset"
    And I should see "Amount"
    And I should see "Balance After"
