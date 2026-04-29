import bcrypt from 'bcryptjs'
import prisma from './prisma'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(email: string, password: string): Promise<void> {
  const hashedPassword = await hashPassword(password)
  await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
    },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}
