'use client'

import { useState, useEffect } from 'react'
import { Search, ArrowRight, X, Calendar, Tag, LayoutGrid, List, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  day: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  week: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  month: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
}

export default function Home() {
  const [reports, setReports] = useState<Report[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [activeType, setActiveType] = useState('all')
  const [activeTopic, setActiveTopic] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card')

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
  }, [])

  useEffect(() => {
    fetchReports()
  }, [activeType, activeTopic, keyword])

  const handleRead = async (id: string) => {
    const res = await fetch(`/api/reports/${id}`)
    const data = await res.json()
    setSelectedReport(data)
  }

  const closeModal = () => {
    setSelectedReport(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50">
      <header className="bg-white/60 backdrop-blur-xl border-b border-stone-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl flex items-center justify-center shadow-lg shadow-stone-900/20">
              <span className="text-white text-sm font-bold">档</span>
            </div>
            <div>
              <span className="font-semibold text-stone-900">报告归档</span>
              <p className="text-xs text-stone-500">整理和回顾您的工作</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <a 
              href="/admin" 
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all duration-200"
            >
              管理
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <section className="mb-12 lg:mb-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold text-stone-900 mb-3 tracking-tight">
                工作报告
              </h1>
              <p className="text-lg text-stone-500 max-w-2xl">
                整理和回顾您的日报、周报和月报，让工作更有条理
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1.5 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-stone-900 text-white shadow-md' 
                    : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'card' 
                    ? 'bg-stone-900 text-white shadow-md' 
                    : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索报告标题或内容..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-300 transition-all duration-200 shadow-sm text-base"
            />
          </div>
        </section>

        <section className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setActiveType('all')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeType === 'all'
                  ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              全部
            </button>
            {Object.entries(typeLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setActiveType(value)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeType === value
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTopic('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTopic === 'all'
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
              }`}
            >
              全部分类
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTopic === topic
                    ? 'bg-stone-100 text-stone-900'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        <section>
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full mx-auto animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-stone-400" />
              </div>
              <p className="text-stone-600 text-lg font-medium mb-2">暂无报告</p>
              <p className="text-stone-400 text-sm">开始上传您的第一份工作报告吧</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleRead(report.id)}
                  className="group bg-white border border-stone-200 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-900/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                          typeColors[report.type as keyof typeof typeColors]
                        }`}>
                          {typeLabels[report.type as keyof typeof typeLabels]}
                        </span>
                        <span className="text-sm text-stone-500 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          {report.topic}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-stone-700 transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-sm text-stone-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {report.createTime.split('T')[0]}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center group-hover:bg-stone-900 transition-colors">
                      <ArrowRight className="w-5 h-5 text-stone-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleRead(report.id)}
                  className="group bg-white border border-stone-200 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:border-stone-300 hover:shadow-2xl hover:shadow-stone-900/10 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 ${
                    report.type === 'day' ? 'bg-blue-500/20' :
                    report.type === 'week' ? 'bg-emerald-500/20' : 'bg-violet-500/20'
                  }`} />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                        typeColors[report.type as keyof typeof typeColors]
                      }`}>
                        {typeLabels[report.type as keyof typeof typeLabels]}
                      </span>
                      <span className="text-xs text-stone-500 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {report.topic}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-bold text-stone-900 mb-3 line-clamp-2 group-hover:text-stone-700 transition-colors">
                      {report.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.createTime.split('T')[0]}
                      </p>
                      <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center group-hover:bg-stone-900 transition-colors">
                        <ArrowRight className="w-4 h-4 text-stone-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div 
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            />
            <motion.div 
              className="fixed inset-4 sm:inset-8 lg:inset-16 z-50 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between px-6 lg:px-8 py-4 lg:py-5 border-b border-stone-100 bg-white/80 backdrop-blur-sm">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="font-bold text-lg lg:text-xl text-stone-900 truncate">{selectedReport.title}</h2>
                  <p className="text-sm text-stone-500 mt-1">
                    {typeLabels[selectedReport.type as keyof typeof typeLabels]} · {selectedReport.topic}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-600" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-stone-50">
                <iframe
                  srcDoc={selectedReport.content}
                  className="w-full h-full border-none bg-white"
                  title={selectedReport.title}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
