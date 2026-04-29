import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/lib/prisma'
import { saveFile, generateFilename } from '@/lib/storage'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const title = formData.get('title') as string
  const type = formData.get('type') as string
  const topic = formData.get('topic') as string

  if (!file || !title || !type || !topic) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!file.name.endsWith('.html')) {
    return NextResponse.json({ error: 'Only HTML files are allowed' }, { status: 400 })
  }

  const content = await file.text()
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
