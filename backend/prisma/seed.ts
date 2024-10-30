import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.onlineStatus.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  console.log('All data has been deleted');
  
  // Seed Users
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'securepassword1',
      profilePic: '/images/alice.jpg',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'securepassword2',
      profilePic: '/images/bob.jpg',
    },
  });

  // Seed Conversations
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: user1.id, joinedAt: new Date() },
          { userId: user2.id, joinedAt: new Date() },
        ],
      },
    },
  });

  // Seed Messages
  await prisma.message.create({
    data: {
      content: 'Hello, Bob!',
      senderId: user1.id,
      conversationId: conversation.id,
    },
  });

  await prisma.message.create({
    data: {
      content: 'Hi Alice!',
      senderId: user2.id,
      conversationId: conversation.id,
    },
  });

  // Seed Notifications
  await prisma.notification.create({
    data: {
      recipientId: user2.id,
      messageId: 1,
      isRead: false,
    },
  });

  // Seed Online Status
  await prisma.onlineStatus.create({
    data: {
      userId: user1.id,
      isOnline: true,
      lastActiveAt: new Date(),
    },
  });

  await prisma.onlineStatus.create({
    data: {
      userId: user2.id,
      isOnline: false,
      lastActiveAt: new Date(),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
