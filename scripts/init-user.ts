import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@example.com'
  const password = process.argv[3] || 'password'

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log(`User ${email} already exists`)
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: 'Admin',
      },
    })

    console.log(`Default admin user created:`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Password: ${password}`)
    console.log(`  Name: ${user.name}`)
  } catch (error) {
    console.error('Error creating user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
