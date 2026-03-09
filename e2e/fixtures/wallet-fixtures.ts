/**
 * Wallet fixtures — extends Playwright test with Synpress MetaMask fixtures.
 * Provides `metamask`, `metamaskPage`, `extensionId`, `context` fixtures.
 * Import this instead of @playwright/test in wallet-tagged specs.
 */

import { testWithSynpress } from '@synthetixio/synpress';
import { metaMaskFixtures } from '@synthetixio/synpress/playwright';
import basicSetup from '../wallet-setup/basic.setup.js';

const test = testWithSynpress(metaMaskFixtures(basicSetup));

export { test };
export const { expect } = test;
