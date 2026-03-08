@crud
Feature: Vault Management
  Authenticated users can view vault accounts.

  Background:
    Given API: user "owner" is authenticated

  Scenario: View vault list page
    Given I am on the "vault/accounts" page
    Then I should see "Vault"

  Scenario: API vault list returns data
    When API: GET "/vaults" returns 200
    Then API: response should contain "data"
