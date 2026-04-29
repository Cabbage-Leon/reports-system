import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const total = await prisma.report.count()
  const day = await prisma.report.count({ where: { type: 'day' } })
  const week = await prisma.report.count({ where: { type: 'week' } })
  const month = await prisma.report.count({ where: { type: 'month' } })

  return NextResponse.json({ total, day, week, month })
}
