@smoke
Feature: [Feature Name]
  [Brief description of what this feature tests]

  Background:
    Given I am on the "[page]" page

  Scenario: [Happy path scenario name]
    When I fill "[field1]" with "[value1]"
    And I fill "[field2]" with "[value2]"
    And I click button "[Button Text]"
    Then I should see "[expected text]"
    And the URL should contain "[expected-path]"

  Scenario: [Negative scenario name]
    When I fill "[field1]" with "[invalid value]"
    And I click button "[Button Text]"
    Then I should see "[error message]"

  Scenario Outline: [Validation scenario] - <case>
    When I fill "[field]" with "<input>"
    And I click button "[Button Text]"
    Then I should see "<message>"

    Examples:
      | case           | input        | message          |
      | empty field    |              | Required         |
      | invalid input  | bad-value    | Invalid format   |

  # Hybrid UI + API example
  Scenario: [API verification scenario]
    Given API: user "owner" is authenticated
    When I click button "[Action]"
    Then I should see "[confirmation]"
    When API: GET "/[endpoint]" returns 200
    Then API: response should contain "[field]"
