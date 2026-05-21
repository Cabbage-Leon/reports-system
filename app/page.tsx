'use client'

import { useState, useEffect } from 'react'
import { Search, ArrowRight, X, Calendar, Tag, LayoutGrid, List } from 'lucide-react'

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

const typeColors = {
  day: 'bg-blue-50 text-blue-700 border-blue-200',
  week: 'bg-green-50 text-green-700 border-green-200',
  month: 'bg-purple-50 text-purple-700 border-purple-200',
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
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')

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

  useEffect(() => {
    fetchReports()
    fetchTopics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, activeTopic, keyword])

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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-stone-900 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-semibold">档</span>
            </div>
            <span className="font-medium text-stone-800 text-sm">报告归档</span>
          </div>
          <nav className="flex items-center gap-1">
            <a href="/admin" className="btn-ghost text-xs">
              管理
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <section className="mb-12 animate-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-display text-2xl sm:text-3xl text-stone-900">
                工作报告
              </h1>
              <p className="text-stone-500 text-xs sm:text-sm mt-1">
                整理和回顾您的工作日报、周报和月报
              </p>
            </div>
            <div className="flex items-center bg-stone-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-stone-900 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'card' 
                    ? 'bg-white text-stone-900 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索报告..."
              className="input-field pl-10 text-sm"
            />
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveType('all')}
              className={`type-pill text-xs ${activeType === 'all' ? 'type-pill-active' : 'type-pill-inactive'}`}
            >
              全部
            </button>
            {Object.entries(typeLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setActiveType(value)}
                className={`type-pill text-xs ${activeType === value ? 'type-pill-active' : 'type-pill-inactive'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTopic('all')}
              className={`type-pill text-xs px-3 py-1.5 ${activeTopic === 'all' ? 'type-pill-active' : 'type-pill-inactive'}`}
            >
              全部主题
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`type-pill text-xs px-3 py-1.5 ${activeTopic === topic ? 'type-pill-active' : 'type-pill-inactive'}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        <section>
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-stone-300 mb-4">
                <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm">暂无匹配的报告</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="divide-y divide-stone-100 -mx-4 sm:-mx-6">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  onClick={() => handleRead(report.id)}
                  className="report-item group opacity-0 animate-in px-4 sm:px-6 cursor-pointer"
                  style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start justify-between gap-3 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          typeColors[report.type as keyof typeof typeColors]
                        }`}>
                          {typeLabels[report.type as keyof typeof typeLabels]}
                        </span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {report.topic}
                        </span>
                      </div>
                      <h3 className="report-title group-hover:text-stone-900 text-base">{report.title}</h3>
                      <p className="report-meta flex items-center gap-1 mt-1 text-xs">
                        <Calendar className="w-2.5 h-2.5" />
                        {report.createTime.split('T')[0]}
                      </p>
                    </div>
                    <ArrowRight className="report-arrow group-hover:opacity-100 group-hover:translate-x-0 w-4 h-4 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  onClick={() => handleRead(report.id)}
                  className="opacity-0 animate-in cursor-pointer"
                  style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'forwards' }}
                >
                  <div className={`bg-white border rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                    typeColors[report.type as keyof typeof typeColors].split(' ')[0]
                  } border-stone-200`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            typeColors[report.type as keyof typeof typeColors]
                          }`}>
                            {typeLabels[report.type as keyof typeof typeLabels]}
                          </span>
                          <span className="text-[11px] text-stone-500 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {report.topic}
                          </span>
                        </div>
                        <h3 className="font-medium text-stone-800 text-sm line-clamp-2">
                          {report.title}
                        </h3>
                        <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {report.createTime.split('T')[0]}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5 group-hover:text-stone-600" />
                    </div>
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
            className={`fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-50 transition-opacity duration-300 ${isReading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeModal}
          />
          <div className={`fixed inset-0 z-50 flex flex-col bg-white transition-all duration-300 ${isReading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-stone-100">
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-stone-900 text-sm truncate">{selectedReport.title}</h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {typeLabels[selectedReport.type as keyof typeof typeLabels]} · {selectedReport.topic}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="btn-ghost p-2 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={selectedReport.content}
                className="w-full h-full border-none bg-white"
                title={selectedReport.title}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
