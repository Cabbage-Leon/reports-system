import './globals.css'
import type { Metadata } from 'next'
import SessionWrapper from '@/components/SessionWrapper'
import { VersionBadge } from '@/components/VersionBadge'

export const metadata: Metadata = {
  title: '个人报告归档',
  description: '日报、周报、月报管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="font-inter">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <SessionWrapper>
          {children}
        </SessionWrapper>
        <VersionBadge />
      </body>
    </html>
  )
}
