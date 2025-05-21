// Mock for Prisma
export const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    chat: {
      findUnique: jest.fn(),
    },
    image: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    pendingUpload: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(prisma);
    }),
  };
  
  // Reset all mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });