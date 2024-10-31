import { PrismaClient, ChatType, ChatRole } from '@prisma/client'
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
      const hashedPassword = await bcrypt.hash(faker.internet.password(), 10);
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
  const privateChats = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const user1 = users[Math.floor(Math.random() * users.length)]
      const user2 = users.find(u => u.id !== user1.id) || users[0]

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
      })

      // Generate Messages for Private Chat
      await Promise.all(
        Array.from({ length: faker.number.int({ min: 5, max: 20 }) }).map(async () => {
          const sender = Math.random() > 0.5 ? user1 : user2
          await prisma.message.create({
            data: {
              chatId: chat.id,
              senderId: sender.id,
              content: faker.lorem.sentence(),
              image: Math.random() > 0.8 ? faker.image.urlLoremFlickr() : null,
            }
          })
        })
      )

      return chat
    })
  )

  // Generate Group Chats
  const groupChats = await Promise.all(
    Array.from({ length: 3 }).map(async () => {
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
      await Promise.all(
        Array.from({ length: faker.number.int({ min: 10, max: 50 }) }).map(async () => {
          const sender = users[Math.floor(Math.random() * users.length)]
          await prisma.message.create({
            data: {
              chatId: chat.id,
              senderId: sender.id,
              content: faker.lorem.sentence(),
              image: Math.random() > 0.9 ? faker.image.urlLoremFlickr() : null,
            }
          })
        })
      )

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