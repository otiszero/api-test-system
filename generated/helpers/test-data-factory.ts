import { faker } from '@faker-js/faker';

/**
 * Test data factory for Upmount Custody Platform
 * Generates realistic test data for all API resources
 */
class TestDataFactory {
  // =========================================================================
  // AUTH
  // =========================================================================

  createRegisterPayload(overrides: Partial<any> = {}) {
    return {
      email: faker.internet.email({ provider: 'smoke-test.example.com' }),
      password: `Test${faker.string.alphanumeric(8)}!1`,
      ...overrides,
    };
  }

  createLoginPayload(email: string, password: string) {
    return { email, password };
  }

  // =========================================================================
  // KYB (Know Your Business)
  // =========================================================================

  createKybPayload(overrides: Partial<any> = {}) {
    return {
      legalBusinessName: faker.company.name(),
      countryId: 1,
      contactEmail: faker.internet.email(),
      businessAddress: faker.location.streetAddress({ useFullAddress: true }),
      businessDescription: faker.company.catchPhrase(),
      registrationNumber: faker.string.alphanumeric(10).toUpperCase(),
      dateOfIncorporation: faker.date.past({ years: 5 }).toISOString().split('T')[0],
      businessType: faker.helpers.arrayElement(['company', 'partnership', 'other']),
      ownerships: [this.createKybOwnership()],
      fileIds: [],
      ...overrides,
    };
  }

  createKybOwnership(overrides: Partial<any> = {}) {
    return {
      fullName: faker.person.fullName(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }).toISOString().split('T')[0],
      countryId: 1,
      email: faker.internet.email(),
      ownerRole: 'primary_owner',
      organizationRole: faker.person.jobTitle(),
      ...overrides,
    };
  }

  // =========================================================================
  // VAULT
  // =========================================================================

  createVaultPayload(otp: string, overrides: Partial<any> = {}) {
    return {
      name: `Vault-${faker.string.alphanumeric(6)}`,
      otp,
      ...overrides,
    };
  }

  createVaultUpdatePayload(otp: string, overrides: Partial<any> = {}) {
    return {
      name: `Updated-Vault-${faker.string.alphanumeric(6)}`,
      otp,
      ...overrides,
    };
  }

  createAddAssetsPayload(otp: string, assetIds: number[]) {
    return { otp, assetIds };
  }

  createAssignUsersPayload(otp: string, userIds: string[]) {
    return { otp, userIds };
  }

  // =========================================================================
  // WITHDRAW
  // =========================================================================

  createWithdrawPayload(otp: string, overrides: Partial<any> = {}) {
    return {
      otp,
      amount: '0.001',
      ...overrides,
    };
  }

  // =========================================================================
  // FILES
  // =========================================================================

  createPresignedPostPayload(overrides: Partial<any> = {}) {
    return {
      type: 'kyb',
      fileName: `doc-${faker.string.alphanumeric(8)}.pdf`,
      ...overrides,
    };
  }

  // =========================================================================
  // ORGANIZATION
  // =========================================================================

  createOrgUpdatePayload(overrides: Partial<any> = {}) {
    return {
      name: faker.company.name(),
      ...overrides,
    };
  }

  createInvitePayload(overrides: Partial<any> = {}) {
    return {
      email: faker.internet.email({ provider: 'invite-test.example.com' }),
      ...overrides,
    };
  }

  // =========================================================================
  // INVALID DATA (for security/validation tests)
  // =========================================================================

  getInvalidValues() {
    return {
      emptyString: '',
      nullValue: null,
      undefinedValue: undefined,
      longString: 'a'.repeat(10000),
      sqlInjection: "'; DROP TABLE users; --",
      xssPayload: '<script>alert("XSS")</script>',
      specialChars: '!@#$%^&*()_+{}[]|:";\'<>?,./~`',
      zero: 0,
      negativeNumber: -1,
      maxInt: Number.MAX_SAFE_INTEGER + 1,
      invalidEmail: ['notanemail', '@example.com', 'user@@example.com', 'user@', ''],
      emptyArray: [],
      invalidOtp: ['00000', '1234567', 'abcdef', '', null],
      invalidUuid: ['not-a-uuid', '123', '', null],
    };
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  generateUuid(): string {
    return faker.string.uuid();
  }

  generateId(): number {
    return faker.number.int({ min: 1, max: 999999 });
  }

  generateEmail(): string {
    return faker.internet.email();
  }

  generateOtp(): string {
    return faker.string.numeric(6);
  }

  pastDate(days: number = 30): string {
    return faker.date.recent({ days }).toISOString();
  }

  futureDate(days: number = 30): string {
    return faker.date.soon({ days }).toISOString();
  }
}

export const testDataFactory = new TestDataFactory();
export default testDataFactory;
