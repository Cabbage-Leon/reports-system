import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const total = await prisma.report.count()
    const day = await prisma.report.count({ where: { type: 'day' } })
    const week = await prisma.report.count({ where: { type: 'week' } })
    const month = await prisma.report.count({ where: { type: 'month' } })

    return NextResponse.json({ total, day, week, month })
  } catch (error) {
    console.error('[Stats API] Failed to fetch stats:', error)
    return NextResponse.json({ total: 0, day: 0, week: 0, month: 0 }, { status: 200 })
  }
}
