import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const reports = await prisma.report.findMany()
    const topics = Array.from(new Set(reports.map(r => r.topic)))
    return NextResponse.json(topics)
  } catch (error) {
    console.error('[Topics API] Failed to fetch topics:', error)
    return NextResponse.json([], { status: 200 })
  }
}
