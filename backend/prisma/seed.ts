import { PrismaClient, ChatType, ChatRole, User, Message, Image, Chat } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client'

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
  await prisma.image.deleteMany()

  // Generate Users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);

      const user = await prisma.user.create({
        data: {
          name: sanitizeName(`${faker.person.firstName()} ${faker.person.lastName()}`),
          email: faker.internet.email(),
          password: hashedPassword,
          block: [],
          statusMessage: faker.person.bio(),
          lastSeen: faker.date.recent(),
        }
      });
  
      const avatar = await prisma.image.create({
        data: {
          url: faker.image.avatarGitHub(),
          key: faker.string.uuid(),
          userId: user.id  
        }
      });
  
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          avatarId: avatar.id
        }
      });
    })

  );
  

  // Generate Private Chats
  const generateUniqueChatsWithMessages = async (users: User[], count: number) => {
    const existingPairs = new Set<string>();
    const privateChats: Chat[] = [];
  
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
  
      const messages: Array<Prisma.MessageCreateManyInput & { createdAt: Date }> = [];
      const images: Prisma.ImageCreateManyInput[] = [];

      for (let i = 0; i < faker.number.int({ min: 50, max: 100 }); i++) {
        const sender = Math.random() > 0.5 ? user1 : user2;
        const messageCreatedAt = new Date(Date.now() - i * 60 * 1000);
        
        const messageData: Prisma.MessageCreateManyInput & { createdAt: Date } = {
          chatId: chat.id,
          senderId: sender.id,
          content: faker.lorem.sentence(),
          createdAt: messageCreatedAt
        };

        if (Math.random() > 0.8) {
          const imageRecord = {
            url: faker.image.urlLoremFlickr(),
            key: `chat_${chat.id}_message_${i}`,
          };
          
          images.push(imageRecord);
          
        }

        messages.push(messageData);
      }

      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  
      await prisma.$transaction(async (tx) => {
        let imageIndex = 0;

        for (let i = 0; i < messages.length; i++) {
          if (imageIndex < images.length) {
            const createdMessage = await tx.message.create({
              data: messages[i]
            });
      
            await tx.image.create({
              data: {
                ...images[imageIndex],
                messageId: createdMessage.id
              }
            });

            imageIndex++;
          } else {
            await tx.message.create({
              data: messages[i]
            });
          }
        }
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

      const avatar = await prisma.image.create({
        data: {
          url: faker.image.urlLoremFlickr({ category: 'abstract' }),
          key: faker.string.uuid(),
          chatId: chat.id
        }
      });

      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          groupAvatarId: avatar.id
        }
      })

      // Generate Messages for Group Chat
      const messages: Array<Prisma.MessageCreateManyInput & { createdAt: Date }> = [];
      const images: Prisma.ImageCreateManyInput[] = [];

      const messageCount = faker.number.int({ min: 50, max: 100 });

      for (let i = 0; i < messageCount; i++) {
        const sender = users[Math.floor(Math.random() * users.length)];
        const messageCreatedAt = new Date(Date.now() - i * 60 * 1000);
        
        const messageData: Prisma.MessageCreateManyInput & { createdAt: Date } = {
          chatId: chat.id,
          senderId: sender.id,
          content: faker.lorem.sentence(),
          createdAt: messageCreatedAt
        };

        if (Math.random() > 0.8) {
          const imageRecord = {
            url: faker.image.urlLoremFlickr(),
            key: `chat_${chat.id}_message_${i}`
          };
          
          images.push(imageRecord);
          
        }

        messages.push(messageData);
      }

      messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      await prisma.$transaction(async (tx) => {
        let imageIndex = 0;

        for (let i = 0; i < messages.length; i++) {
          if (imageIndex < images.length) {

            const createdMessage = await tx.message.create({
              data: {
                ...messages[i],
              }
            });

            await tx.image.create({
              data: {
                ...images[imageIndex],
                messageId: createdMessage.id 
              }
            });

            imageIndex++;
          } else {
            await tx.message.create({
              data: messages[i]
            });
          }
        }
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