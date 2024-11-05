// tests/setup/jest.setup.ts
import { beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create Prisma client
const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Export prisma client for use in tests
export { prisma };