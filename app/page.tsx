'use client'

import { useState, useEffect } from 'react'
import { Book, Search, FileText, ArrowRight, Eye, X, Calendar, Tag, Sparkles } from 'lucide-react'

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

  const typeConfig = {
    day: { label: '日报', color: 'badge-success', bgColor: 'from-green-500/20 to-emerald-500/20' },
    week: { label: '周报', color: 'badge-info', bgColor: 'from-blue-500/20 to-indigo-500/20' },
    month: { label: '月报', color: 'badge-warning', bgColor: 'from-orange-500/20 to-amber-500/20' },
  }

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:shadow-primary/40 transition-shadow">
              <Book className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">报告归档</h1>
          </div>
          <nav className="flex items-center gap-4">
            <a 
              href="/admin" 
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              管理后台
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">工作 · 政策 · 行业研究 · 日常总结</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">日报</span>
            <span className="text-gray-800 mx-3">|</span>
            <span className="gradient-text">周报</span>
            <span className="text-gray-800 mx-3">|</span>
            <span className="gradient-text">月报</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            在这里管理和浏览您的工作报告，支持多种分类和快速搜索
          </p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索报告标题、主题..."
              className="input-field pl-12 pr-4 py-4 text-lg"
            />
          </div>
        </section>

        <section className="mb-10">
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { value: 'all', label: '全部' },
              { value: 'day', label: '日报' },
              { value: 'week', label: '周报' },
              { value: 'month', label: '月报' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setActiveType(item.value)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeType === item.value
                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30'
                    : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveTopic('all')}
              className={`badge transition-all duration-300 ${
                activeTopic === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              全部标签
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`badge transition-all duration-300 ${
                  activeTopic === topic
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white/60 text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-gray-500 text-lg">加载中...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无匹配的报告</h3>
            <p className="text-gray-400">试试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <div
                key={report.id}
                className="glass-card rounded-2xl p-6 card-hover animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`badge ${typeConfig[report.type as keyof typeof typeConfig].color}`}>
                    {typeConfig[report.type as keyof typeof typeConfig].label}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {report.createTime.split('T')[0]}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                  {report.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
                  <Tag className="w-4 h-4" />
                  <span>{report.topic}</span>
                </div>
                <button
                  onClick={() => handleRead(report.id)}
                  className="w-full py-3 bg-gradient-to-r from-primary/10 to-indigo-100 text-primary rounded-xl font-medium flex items-center justify-center gap-2 hover:from-primary/20 hover:to-indigo-200 transition-all duration-300"
                >
                  <Eye className="w-4 h-4" />
                  阅读全文
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {isReading && selectedReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">{selectedReport.title}</h3>
              <button
                onClick={() => setIsReading(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 h-[calc(90vh-80px)] overflow-auto">
              <iframe
                srcDoc={selectedReport.content}
                className="w-full h-full min-h-[500px] border-none rounded-xl bg-white"
                title={selectedReport.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
