'use client'

import { useState, useEffect } from 'react'
import { Search, ArrowRight, X, Calendar, Tag } from 'lucide-react'

interface Report {
  id: string
  title: string
  type: string
  typeText: string
  topic: string
  filePath: string
  createTime: string
  content?: string
}

const typeLabels = {
  day: '日报',
  week: '周报',
  month: '月报',
}

export default function Home() {
  const [reports, setReports] = useState<Report[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [activeType, setActiveType] = useState('all')
  const [activeTopic, setActiveTopic] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isReading, setIsReading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
    fetchTopics()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [activeType, activeTopic, keyword])

  const fetchReports = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeType !== 'all') params.set('type', activeType)
    if (activeTopic !== 'all') params.set('topic', activeTopic)
    if (keyword) params.set('keyword', keyword)

    const res = await fetch(`/api/reports?${params.toString()}`)
    const data = await res.json()
    setReports(data)
    setLoading(false)
  }

  const fetchTopics = async () => {
    const res = await fetch('/api/topics')
    const data = await res.json()
    setTopics(data)
  }

  const handleRead = async (id: string) => {
    const res = await fetch(`/api/reports/${id}`)
    const data = await res.json()
    setSelectedReport(data)
    setIsReading(true)
  }

  const closeModal = () => {
    setIsReading(false)
    setTimeout(() => setSelectedReport(null), 300)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">档</span>
            </div>
            <span className="font-medium text-stone-800">报告归档</span>
          </div>
          <nav className="flex items-center gap-1">
            <a href="/admin" className="btn-ghost">
              管理
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <section className="mb-16 animate-in">
          <h1 className="text-display text-4xl text-stone-900 mb-4">
            工作报告
          </h1>
          <p className="text-stone-500 text-lg mb-8 max-w-xl">
            整理和回顾您的工作日报、周报和月报
          </p>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索报告..."
              className="input-field pl-12"
            />
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveType('all')}
              className={`type-pill ${activeType === 'all' ? 'type-pill-active' : 'type-pill-inactive'}`}
            >
              全部
            </button>
            {Object.entries(typeLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setActiveType(value)}
                className={`type-pill ${activeType === value ? 'type-pill-active' : 'type-pill-inactive'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTopic('all')}
              className={`type-pill text-xs ${activeTopic === 'all' ? 'type-pill-active' : 'type-pill-inactive'}`}
            >
              全部主题
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`type-pill text-xs ${activeTopic === topic ? 'type-pill-active' : 'type-pill-inactive'}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-stone-300 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-stone-500">暂无匹配的报告</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  onClick={() => handleRead(report.id)}
                  className="report-item group opacity-0 animate-in"
                  style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          {typeLabels[report.type as keyof typeof typeLabels]}
                        </span>
                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {report.topic}
                        </span>
                      </div>
                      <h3 className="report-title">{report.title}</h3>
                      <p className="report-meta flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {report.createTime.split('T')[0]}
                      </p>
                    </div>
                    <ArrowRight className="report-arrow w-5 h-5 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedReport && (
        <>
          <div 
            className={`fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${isReading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeModal}
          />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden z-50 transition-all duration-300 ${isReading ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h2 className="font-medium text-stone-900">{selectedReport.title}</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {typeLabels[selectedReport.type as keyof typeof typeLabels]} · {selectedReport.topic}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="btn-ghost p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[calc(85vh-73px)] overflow-auto">
              <iframe
                srcDoc={selectedReport.content}
                className="w-full h-full min-h-[500px] border-none bg-white"
                title={selectedReport.title}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
