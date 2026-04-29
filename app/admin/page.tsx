'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  FileText,
  Edit,
  Trash2,
  Eye,
  X,
  Plus,
  Home,
  BarChart3,
  FolderOpen,
  Search,
  User,
  LogOut,
  Menu,
} from 'lucide-react'

interface Report {
  id: string
  title: string
  type: string
  typeText: string
  topic: string
  filePath: string
  createTime: string
  updateTime: string
  content?: string
}

interface Stats {
  total: number
  day: number
  week: number
  month: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, day: 0, week: 0, month: 0 })
  const [activeType, setActiveType] = useState('all')
  const [activeTopic, setActiveTopic] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isReadModalOpen, setIsReadModalOpen] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'week',
    topic: '',
    file: null as File | null,
  })

  const [editForm, setEditForm] = useState({
    id: '',
    title: '',
    type: 'week',
    topic: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    refreshData()
  }, [activeType, activeTopic, keyword])

  const refreshData = async () => {
    await fetchReports()
    await fetchTopics()
    await fetchStats()
  }

  const fetchReports = async () => {
    const params = new URLSearchParams()
    if (activeType !== 'all') params.set('type', activeType)
    if (activeTopic !== 'all') params.set('topic', activeTopic)
    if (keyword) params.set('keyword', keyword)

    const res = await fetch(`/api/reports?${params.toString()}`)
    const data = await res.json()
    setReports(data)
  }

  const fetchTopics = async () => {
    const res = await fetch('/api/topics')
    const data = await res.json()
    setTopics(data)
  }

  const fetchStats = async () => {
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data)
  }

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.type || !uploadForm.topic || !uploadForm.file) {
      alert('请填写完整信息')
      return
    }

    const formData = new FormData()
    formData.append('file', uploadForm.file)
    formData.append('title', uploadForm.title)
    formData.append('type', uploadForm.type)
    formData.append('topic', uploadForm.topic)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      setIsUploadModalOpen(false)
      setUploadForm({ title: '', type: 'week', topic: '', file: null })
      refreshData()
    } else {
      alert('上传失败')
    }
  }

  const handleEdit = async () => {
    if (!editForm.title || !editForm.type || !editForm.topic) {
      alert('请填写完整信息')
      return
    }

    const res = await fetch(`/api/reports/${editForm.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title,
        type: editForm.type,
        topic: editForm.topic,
      }),
    })

    if (res.ok) {
      setIsEditModalOpen(false)
      refreshData()
    } else {
      alert('更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该报告？')) return

    const res = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      refreshData()
    } else {
      alert('删除失败')
    }
  }

  const handleRead = async (id: string) => {
    const res = await fetch(`/api/reports/${id}`)
    const data = await res.json()
    setSelectedReport(data)
    setIsReadModalOpen(true)
  }

  const openEditModal = (report: Report) => {
    setEditForm({
      id: report.id,
      title: report.title,
      type: report.type,
      topic: report.topic,
    })
    setIsEditModalOpen(true)
  }

  const typeConfig = {
    day: { label: '日报', color: 'bg-green-100 text-green-700' },
    week: { label: '周报', color: 'bg-blue-100 text-blue-700' },
    month: { label: '月报', color: 'bg-orange-100 text-orange-700' },
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold gradient-text">管理后台</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="btn-secondary text-sm flex items-center gap-2">
              <Home className="w-4 h-4" />
              返回首页
            </a>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 fixed lg:sticky top-16 h-[calc(100vh-64px)] overflow-hidden transition-all duration-300 z-40`}>
          <div className="glass-card h-full rounded-r-2xl p-5 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-2">
                <FolderOpen className="w-3 h-3" />
                报告类型
              </h3>
              <div className="space-y-1">
                {[{ value: 'all', label: '全部报告' }, { value: 'day', label: '日报' }, { value: 'week', label: '周报' }, { value: 'month', label: '月报' }].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setActiveType(item.value)}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeType === item.value
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-2">
                <FolderOpen className="w-3 h-3" />
                主题分类
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTopic('all')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTopic === 'all'
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  全部分类
                </button>
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setActiveTopic(topic)}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeTopic === topic
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-xs text-gray-500 mb-3 font-medium flex items-center gap-2">
                <BarChart3 className="w-3 h-3" />
                数据统计
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-primary/10 to-indigo-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-xs text-gray-500">总计</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.day}</div>
                  <div className="text-xs text-gray-500">日报</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.week}</div>
                  <div className="text-xs text-gray-500">周报</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500/10 to-amber-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.month}</div>
                  <div className="text-xs text-gray-500">月报</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">{session.user?.name}</div>
                  <div className="text-xs text-gray-500">{session.user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className={`flex-1 min-h-[calc(100vh-64px)] transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <div className="p-6">
            <div className="glass-card rounded-2xl p-5 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索报告标题、主题..."
                    className="input-field pl-12 w-full"
                  />
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  上传报告
                </button>
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="glass-card rounded-2xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无报告</h3>
                <p className="text-gray-400">点击上方按钮上传您的第一份报告</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {reports.map((report, index) => (
                  <div
                    key={report.id}
                    className="glass-card rounded-2xl p-6 card-hover animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className={`badge ${typeConfig[report.type as keyof typeof typeConfig].color}`}>
                        {typeConfig[report.type as keyof typeof typeConfig].label}
                      </span>
                      <span className="text-xs text-gray-400">{report.createTime.split('T')[0]}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                      {report.title}
                    </h4>
                    <div className="text-sm text-gray-500 mb-5">{report.topic}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRead(report.id)}
                        className="flex-1 py-2.5 bg-primary/10 text-primary rounded-xl font-medium flex items-center justify-center gap-1 hover:bg-primary/20 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        查看
                      </button>
                      <button
                        onClick={() => openEditModal(report)}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium flex items-center justify-center gap-1 hover:bg-gray-200 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">上传HTML报告</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="file"
                accept=".html"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                className="w-full p-3 border border-gray-200 rounded-xl hover:border-primary transition-colors"
              />
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="报告标题"
                className="input-field"
              />
              <select
                value={uploadForm.type}
                onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                className="input-field"
              >
                <option value="week">周报</option>
                <option value="day">日报</option>
                <option value="month">月报</option>
              </select>
              <input
                type="text"
                value={uploadForm.topic}
                onChange={(e) => setUploadForm({ ...uploadForm, topic: e.target.value })}
                placeholder="主题分类"
                className="input-field"
              />
              <button onClick={handleUpload} className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                确认上传
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">编辑报告</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="报告标题"
                className="input-field"
              />
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                className="input-field"
              >
                <option value="week">周报</option>
                <option value="day">日报</option>
                <option value="month">月报</option>
              </select>
              <input
                type="text"
                value={editForm.topic}
                onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                placeholder="主题分类"
                className="input-field"
              />
              <button onClick={handleEdit} className="btn-primary w-full">
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {isReadModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">{selectedReport.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsReadModalOpen(false)
                    openEditModal(selectedReport)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedReport.id)
                    setIsReadModalOpen(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
                <button
                  onClick={() => setIsReadModalOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
