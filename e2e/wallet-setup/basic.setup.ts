/**
 * Basic wallet setup — imports seed phrase into MetaMask.
 * Cached by Synpress so the browser state is reused across tests.
 * Secrets loaded from .env via dotenv (METAMASK_SEED_PHRASE, METAMASK_PASSWORD).
 */

import { defineWalletSetup } from '@synthetixio/synpress';
import { MetaMask } from '@synthetixio/synpress/playwright';
import 'dotenv/config';

const SEED_PHRASE = process.env.METAMASK_SEED_PHRASE ?? '';
const PASSWORD = process.env.METAMASK_PASSWORD ?? 'TestPassword1!';

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const metamask = new MetaMask(context, walletPage, PASSWORD);
  await metamask.importWallet(SEED_PHRASE);
});
