/**
 * TOTP helper — generates time-based one-time passwords at runtime.
 * Used by generated E2E specs when scenarios involve 2FA login.
 */

import * as OTPAuth from 'otpauth';

/**
 * Generate a TOTP code from a base32-encoded secret key.
 * Compatible with Google Authenticator, Authy, etc.
 */
export function generateTOTP(secret: string): string {
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.generate();
}
