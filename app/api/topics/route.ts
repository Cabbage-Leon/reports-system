import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const reports = await prisma.report.findMany()
  const topics = [...new Set(reports.map(r => r.topic))]
  return NextResponse.json(topics)
}
