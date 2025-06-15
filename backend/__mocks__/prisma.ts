// Mock for Prisma
export const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
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
    message: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(prisma);
    }),
  };
  
  // Reset all mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });