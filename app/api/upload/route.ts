import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import prisma from '@/lib/prisma'
import { saveFile, generateFilename } from '@/lib/storage'

export async function POST(request: Request) {
  try {
    console.log('[Upload API] Starting file upload process')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('[Upload API] Unauthorized - No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Upload API] Session validated for user:', session.user?.email)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const topic = formData.get('topic') as string

    console.log('[Upload API] Received form data:', {
      hasFile: !!file,
      hasTitle: !!title,
      hasType: !!type,
      hasTopic: !!topic,
      fileName: file?.name,
      fileSize: file?.size
    })

    if (!file || !title || !type || !topic) {
      console.log('[Upload API] Validation failed - Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!file.name.endsWith('.html')) {
      console.log('[Upload API] Validation failed - Invalid file type:', file.name)
      return NextResponse.json({ error: 'Only HTML files are allowed' }, { status: 400 })
    }

    const content = await file.text()
    console.log('[Upload API] File content loaded, length:', content.length)

    const typeText = type === 'day' ? '日报' : type === 'week' ? '周报' : '月报'
    const filename = generateFilename(title)
    console.log('[Upload API] Generated filename:', filename)

    let filePath: string
    try {
      filePath = saveFile(type, filename, content)
      console.log('[Upload API] File saved successfully:', filePath)
    } catch (saveError) {
      console.error('[Upload API] Failed to save file:', saveError)
      return NextResponse.json({ error: 'Failed to save file', details: saveError instanceof Error ? saveError.message : 'Unknown error' }, { status: 500 })
    }

    let report
    try {
      report = await prisma.report.create({
        data: {
          title,
          type,
          typeText,
          topic,
          filePath,
        },
      })
      console.log('[Upload API] Report created successfully:', report.id)
    } catch (dbError) {
      console.error('[Upload API] Failed to create report in database:', dbError)
      return NextResponse.json({ error: 'Failed to save report to database', details: dbError instanceof Error ? dbError.message : 'Unknown error' }, { status: 500 })
    }

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('[Upload API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
