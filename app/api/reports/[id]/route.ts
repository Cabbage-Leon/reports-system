import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/lib/prisma'
import { readFile, deleteFile } from '@/lib/storage'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  const report = await prisma.report.findUnique({
    where: { id },
  })

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  try {
    const content = readFile(report.filePath)
    return NextResponse.json({ ...report, content })
  } catch {
    return NextResponse.json(report)
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const body = await request.json()
  const { title, type, topic } = body

  const typeText = type === 'day' ? '日报' : type === 'week' ? '周报' : '月报'

  const report = await prisma.report.update({
    where: { id },
    data: {
      title,
      type,
      typeText,
      topic,
    },
  })

  return NextResponse.json(report)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  const report = await prisma.report.findUnique({
    where: { id },
  })

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  deleteFile(report.filePath)

  await prisma.report.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Report deleted successfully' }, { status: 200 })
}
