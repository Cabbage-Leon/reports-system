import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/lib/prisma'
import { saveFile, generateFilename } from '@/lib/storage'

export async function POST(request: Request) {
  console.log('[Upload API] Received upload request')
  const session = await getServerSession(authOptions)
  if (!session) {
    console.log('[Upload API] Unauthorized access')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const topic = formData.get('topic') as string

    console.log('[Upload API] Form data:', { title, type, topic, hasFile: !!file })

    if (!file || !title || !type || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!file.name.endsWith('.html')) {
      return NextResponse.json({ error: 'Only HTML files are allowed' }, { status: 400 })
    }

    const content = await file.text()
    console.log('[Upload API] File content length:', content.length)

    const typeText = type === 'day' ? '日报' : type === 'week' ? '周报' : '月报'
    const filename = generateFilename(title)
    
    console.log('[Upload API] Saving file to Vercel Blob...')
    const filePath = await saveFile(type, filename, content)
    console.log('[Upload API] File saved successfully:', filePath)

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
  } catch (error: any) {
    console.error('[Upload API] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to save file', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
