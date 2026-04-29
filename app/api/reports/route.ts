import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/lib/prisma'
import { saveFile, generateFilename } from '@/lib/storage'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'
  const topic = searchParams.get('topic') || 'all'
  const keyword = searchParams.get('keyword') || ''

  let query = prisma.report.findMany({
    orderBy: { createTime: 'desc' },
  })

  if (type !== 'all') {
    query = prisma.report.findMany({
      where: { type },
      orderBy: { createTime: 'desc' },
    })
  }

  let reports = await query

  if (topic !== 'all') {
    reports = reports.filter(r => r.topic === topic)
  }

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase()
    reports = reports.filter(
      r => r.title.toLowerCase().includes(lowerKeyword) || r.topic.toLowerCase().includes(lowerKeyword)
    )
  }

  return NextResponse.json(reports)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, type, topic, content } = body

  if (!title || !type || !topic || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const typeText = type === 'day' ? '日报' : type === 'week' ? '周报' : '月报'
  const filename = generateFilename(title)
  const filePath = saveFile(type, filename, content)

  const report = await prisma.report.create({
    data: {
      title,
      type,
      typeText,
      topic,
      filePath,
    },
  })

  return NextResponse.json(report, { status: 201 })
}
