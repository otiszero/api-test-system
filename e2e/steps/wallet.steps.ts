/**
 * Wallet step definitions — Gherkin patterns for MetaMask interactions.
 * These generate code that uses Synpress MetaMask fixtures (metamask object).
 * The generated code assumes `metamask` is available in the test scope
 * via wallet-fixtures.ts → testWithSynpress(metaMaskFixtures(...)).
 */

import { StepDef } from './types.js';

export const walletSteps: StepDef[] = [
  {
    pattern: 'I connect MetaMask wallet',
    generateCode: () =>
      `await metamask.connectToDapp();`,
  },
  {
    pattern: 'I connect MetaMask wallet with account "{account}"',
    generateCode: ([account]) =>
      `await metamask.connectToDapp(['${account}']);`,
  },
  {
    pattern: 'I approve MetaMask transaction',
    generateCode: () =>
      `await metamask.confirmTransaction();`,
  },
  {
    pattern: 'I reject MetaMask transaction',
    generateCode: () =>
      `await metamask.rejectTransaction();`,
  },
  {
    pattern: 'I sign MetaMask message',
    generateCode: () =>
      `await metamask.confirmSignature();`,
  },
  {
    pattern: 'I reject MetaMask signature',
    generateCode: () =>
      `await metamask.rejectSignature();`,
  },
  {
    pattern: 'I switch MetaMask to network "{name}"',
    generateCode: ([name]) =>
      [
        `const walletConfig = e2eConfig.wallet;`,
        `await metamask.addNetwork({`,
        `  name: '${name}',`,
        `  rpcUrl: walletConfig.network.rpcUrl,`,
        `  chainId: walletConfig.network.chainId,`,
        `  symbol: walletConfig.network.symbol,`,
        `});`,
      ].join('\n'),
  },
  {
    pattern: 'I add MetaMask network "{name}" with chainId {chainId}',
    generateCode: ([name, chainId]) =>
      [
        `await metamask.addNetwork({`,
        `  name: '${name}',`,
        `  rpcUrl: e2eConfig.wallet.network.rpcUrl,`,
        `  chainId: ${chainId},`,
        `  symbol: e2eConfig.wallet.network.symbol,`,
        `});`,
      ].join('\n'),
  },
  {
    pattern: 'I approve MetaMask token permission',
    generateCode: () =>
      `await metamask.approveTokenPermission();`,
  },
  {
    pattern: 'MetaMask should show address "{address}"',
    generateCode: ([address]) =>
      `await expect(page.locator('#accounts, [data-testid="wallet-address"]')).toContainText('${address}');`,
  },
  {
    pattern: 'MetaMask should show balance greater than "{amount}"',
    generateCode: ([amount]) =>
      [
        `const balanceText = await page.locator('[data-testid="wallet-balance"], #balance').textContent();`,
        `const balance = parseFloat(balanceText?.replace(/[^0-9.]/g, '') ?? '0');`,
        `expect(balance).toBeGreaterThan(${amount});`,
      ].join('\n'),
  },
];
