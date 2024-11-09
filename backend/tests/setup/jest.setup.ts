import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Create Prisma client with logging in test mode
const prisma = new PrismaClient({
  log: ['error', 'warn']
});

// Helper function to verify if database is empty
async function verifyDatabaseEmpty() {
  const counts = await prisma.$transaction([
    prisma.userChat.count(),
    prisma.message.count(),
    prisma.chat.count(),
    prisma.user.count()
  ]);
  
  const isEmpty = counts.every(count => count === 0);
  if (!isEmpty) {
    console.warn('Database not empty after cleanup. Record counts:', {
      userChat: counts[0],
      message: counts[1],
      chat: counts[2],
      user: counts[3]
    });
  }
  return isEmpty;
}

// Helper function to cleanup database
async function cleanupDatabase() {
  try {
    await prisma.$transaction(async (tx) => {
      // Temporarily disable foreign key constraints
      await tx.$executeRawUnsafe('SET CONSTRAINTS ALL DEFERRED;');

      // Delete all data from tables in correct order
      await tx.userChat.deleteMany();
      await tx.message.deleteMany();
      await tx.chat.deleteMany();
      await tx.user.deleteMany();

      // Get all sequences and reset them
      const sequences = await tx.$queryRaw<Array<{ sequence_name: string }>>`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public';
      `;

      // Reset each sequence
      for (const { sequence_name } of sequences) {
        await tx.$executeRawUnsafe(`ALTER SEQUENCE "${sequence_name}" RESTART WITH 1;`);
      }

      // Re-enable constraints
      await tx.$executeRawUnsafe('SET CONSTRAINTS ALL IMMEDIATE;');
    });

    console.log('Database cleaned successfully');
  } catch (error) {
    console.error('Error during database cleanup:', error);
    throw error;
  }
}

// Connect to database before all tests
beforeAll(async () => {
  let currentTestFile;
  try {
    await prisma.$connect();
    currentTestFile = expect.getState().testPath;
    console.log(`[${currentTestFile}] Successfully connected to test database`);
  } catch (error) {
    console.error(`[${currentTestFile}] Failed to connect to test database:`, error);
    throw error;
  }
});

// Clean database before each test
beforeEach(async () => {
  console.log('Starting database cleanup before test...');
  await cleanupDatabase();
  
  // Verify cleanup was successful
  const isEmpty = await verifyDatabaseEmpty();
  if (!isEmpty) {
    throw new Error('Database cleanup failed - database is not empty');
  }
});

// Final cleanup and disconnect after all tests
afterAll(async () => {
  console.log('Running final cleanup...');
  try {
    await cleanupDatabase();
    const isEmpty = await verifyDatabaseEmpty();
    if (!isEmpty) {
      console.warn('Warning: Database not empty after final cleanup');
    }
  } catch (error) {
    console.error('Error during final cleanup:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from test database');
  }
});

// Export prisma client for use in tests
export { prisma, verifyDatabaseEmpty, cleanupDatabase };