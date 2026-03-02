import { faker } from '@faker-js/faker';

/**
 * Test data factory using Faker for realistic test data
 */
class TestDataFactory {
  /**
   * Generate market data based on CreateMarketDto schema
   */
  createMarket(overrides: Partial<any> = {}) {
    const now = new Date();
    const publishedAt = faker.date.soon({ days: 1, refDate: now });
    const endTime = faker.date.soon({ days: 30, refDate: publishedAt });
    const startVoteTime = new Date(endTime.getTime() + 1000); // After endTime
    const endVoteTime = faker.date.soon({ days: 7, refDate: startVoteTime });

    return {
      title: faker.lorem.sentence({ min: 5, max: 10 }),
      endTime: endTime.toISOString(),
      publishedAt: publishedAt.toISOString(),
      startVoteTime: startVoteTime.toISOString(),
      endVoteTime: endVoteTime.toISOString(),
      marketFilePath: faker.system.filePath(),
      category: [faker.word.noun(), faker.word.noun()],
      marketRule: faker.lorem.paragraph(),
      type: faker.helpers.arrayElement(['SINGLE', 'MULTIPLE']),
      outcomes: [
        {
          title: 'Yes',
          probability: 50,
        },
        {
          title: 'No',
          probability: 50,
        },
      ],
      resoldMethod: faker.helpers.arrayElement(['AUTOMATICALLY', 'MANUALLY']),
      email: faker.internet.email(),
      ...overrides,
    };
  }

  /**
   * Generate order data
   */
  createOrder(marketId: number, outcomeId: number, overrides: Partial<any> = {}) {
    return {
      marketId,
      outcomeId,
      amount: faker.number.float({ min: 0.01, max: 1000, fractionDigits: 2 }),
      ...overrides,
    };
  }

  /**
   * Generate comment data
   */
  createComment(marketId: number, overrides: Partial<any> = {}) {
    return {
      marketId,
      content: faker.lorem.sentence({ min: 10, max: 50 }),
      ...overrides,
    };
  }

  /**
   * Generate invalid data for validation testing
   */
  getInvalidValues() {
    return {
      // String validation
      emptyString: '',
      nullValue: null,
      undefinedValue: undefined,
      longString: 'a'.repeat(1000),
      sqlInjection: "'; DROP TABLE users; --",
      xssPayload: '<script>alert("XSS")</script>',
      specialChars: '!@#$%^&*()_+{}[]|:";\'<>?,./~`',

      // Number validation
      zero: 0,
      negativeNumber: -1,
      floatForInteger: 3.14159,
      maxInt: Number.MAX_SAFE_INTEGER + 1,
      stringNumber: 'abc123',
      infinityValue: Infinity,

      // Email validation
      invalidEmail: [
        'notanemail',
        '@example.com',
        'user@@example.com',
        'user@',
        '@',
        '',
      ],

      // Array validation
      emptyArray: [],
      tooManyItems: Array(1000).fill('item'),
    };
  }

  /**
   * Generate pagination params
   */
  getPaginationParams(page: number = 1, limit: number = 10) {
    return {
      page,
      limit,
    };
  }

  /**
   * Generate random wallet address (Cardano testnet format)
   */
  generateWalletAddress(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = 'addr_test1';
    for (let i = 0; i < 90; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }

  /**
   * Generate random ID
   */
  generateId(): number {
    return faker.number.int({ min: 1, max: 1000000 });
  }

  /**
   * Generate fake UUID
   */
  generateUuid(): string {
    return faker.string.uuid();
  }

  /**
   * Generate past date
   */
  pastDate(days: number = 30): string {
    return faker.date.past({ years: 0, refDate: new Date() }).toISOString();
  }

  /**
   * Generate future date
   */
  futureDate(days: number = 30): string {
    return faker.date.future({ years: 0, refDate: new Date() }).toISOString();
  }
}

// Export singleton instance
export const testDataFactory = new TestDataFactory();
export default testDataFactory;
