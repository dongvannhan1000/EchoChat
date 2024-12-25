import { PrismaClient, ChatType, ChatRole, User } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient()


function sanitizeName(name: string): string {
  return name
    .normalize('NFD')           
    .replace(/[\u0300-\u036f]/g, '') 
    .replace(/[^\x00-\x7F]/g, '') 
}

async function seedDatabase() {
  // Clear existing data
  await prisma.message.deleteMany()
  await prisma.userChat.deleteMany()
  await prisma.chat.deleteMany()
  await prisma.user.deleteMany()

  // Generate Users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      return prisma.user.create({
        data: {
          name: sanitizeName(`${faker.person.firstName()} ${faker.person.lastName()}`),
          email: faker.internet.email(),
          password: hashedPassword,
          avatar: faker.image.avatarGitHub(),
          block: [],
          statusMessage: faker.person.bio(),
          lastSeen: faker.date.recent(),
        }
      })
    })
  )

  // Generate Private Chats
  const generateUniqueChatsWithMessages = async (users: User[], count: number) => {
    const existingPairs = new Set<string>();
    const privateChats = [];
  
    while (privateChats.length < count) {
      const user1 = users[Math.floor(Math.random() * users.length)];
      const remainingUsers = users.filter(u => u.id !== user1.id);
      const user2 = remainingUsers[Math.floor(Math.random() * remainingUsers.length)];
  
      const chatPair = [user1.id, user2.id].sort().join('-');
      if (existingPairs.has(chatPair)) continue;
  
      existingPairs.add(chatPair);
      
      const chat = await prisma.chat.create({
        data: {
          chatType: ChatType.private,
          createdBy: user1.id,
          participants: {
            create: [
              {
                userId: user1.id,
                role: ChatRole.member,
                isSeen: true,
              },
              {
                userId: user2.id,
                role: ChatRole.member,
                isSeen: false,
              }
            ]
          }
        }
      });
  
      const messages = Array.from({ length: faker.number.int({ min: 50, max: 100 }) })
        .map((_, index) => {
          const sender = Math.random() > 0.5 ? user1 : user2;
          return {
            chatId: chat.id,
            senderId: sender.id,
            content: faker.lorem.sentence(),
            image: Math.random() > 0.8 ? faker.image.urlLoremFlickr() : null,
            createdAt: new Date(Date.now() - index * 60 * 1000)
          };
        })
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
      await prisma.message.createMany({
        data: messages
      });
  
      privateChats.push(chat);
    }
  
    return privateChats;
  };
  
  // Usage
  const privateChats = await generateUniqueChatsWithMessages(users, 20);

  // Generate Group Chats
  const groupChats = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const groupAdminIndex = Math.floor(Math.random() * users.length)
      const groupAdmin = users[groupAdminIndex]

      const chat = await prisma.chat.create({
        data: {
          chatType: ChatType.group,
          groupName: faker.company.name() + " Group",
          groupAvatar: faker.image.urlLoremFlickr({ category: 'abstract' }),
          createdBy: groupAdmin.id,
          participants: {
            create: [
              {
                userId: groupAdmin.id,
                role: ChatRole.admin,
                isSeen: true,
              },
              ...users
                .filter((_, index) => index !== groupAdminIndex)
                .slice(0, faker.number.int({ min: 2, max: 5 }))
                .map(user => ({
                  userId: user.id,
                  role: ChatRole.member,
                  isSeen: false,
                }))
            ]
          }
        }
      })

      // Generate Messages for Group Chat
      const messages = Array.from({ length: faker.number.int({ min: 50, max: 100 }) })
        .map((_, index) => {
          const sender = users[Math.floor(Math.random() * users.length)];
          return {
            chatId: chat.id,
            senderId: sender.id,
            content: faker.lorem.sentence(),
            image: Math.random() > 0.9 ? faker.image.urlLoremFlickr() : null,
            createdAt: new Date(Date.now() - index * 60 * 1000)
          };
        })
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      await prisma.message.createMany({
        data: messages
      });


      return chat
    })
  )

  console.log('Database seeded successfully!')
}

// Run the seeding function
seedDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export {}