@wallet
Feature: MetaMask Wallet Connection

  Scenario: Connect MetaMask to dApp
    Given I am on the "dashboard" page
    When I click button "Connect Wallet"
    And I connect MetaMask wallet
    Then I should see "Connected"

  Scenario: Sign a message with MetaMask
    Given I am on the "dashboard" page
    When I click button "Connect Wallet"
    And I connect MetaMask wallet
    And I click button "Sign Message"
    And I sign MetaMask message
    Then I should see "Signature verified"

  Scenario: Approve a transaction
    Given I am on the "dashboard" page
    When I click button "Connect Wallet"
    And I connect MetaMask wallet
    And I click button "Send Transaction"
    And I approve MetaMask transaction
    Then I should see "Transaction confirmed"
