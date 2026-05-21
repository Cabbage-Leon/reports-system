'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Edit3,
  Trash2,
  Eye,
  X,
  Plus,
  Search,
  User,
  LogOut,
  Menu,
  FileText,
  Layers,
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

const typeLabels = {
  day: '日报',
  week: '周报',
  month: '月报',
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-stone-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">档</span>
              </div>
              <span className="font-medium text-stone-800 hidden sm:block">管理后台</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-secondary text-sm hidden sm:flex items-center gap-2">
              <FileText className="w-4 h-4" />
              访问首页
            </a>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-ghost text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 fixed lg:sticky top-14 h-[calc(100vh-56px)] overflow-hidden transition-all duration-300 z-30`}>
          <div className="h-full bg-white border-r border-stone-200 overflow-y-auto">
            <div className="p-4 space-y-6">
              <div>
                <p className="text-label px-3 mb-2">报告类型</p>
                <div className="space-y-0.5">
                  {[
                    { value: 'all', label: '全部', icon: Layers },
                    { value: 'day', label: '日报', icon: Layers },
                    { value: 'week', label: '周报', icon: Layers },
                    { value: 'month', label: '月报', icon: Layers },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setActiveType(item.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeType === item.value
                          ? 'bg-stone-100 text-stone-900'
                          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-label px-3 mb-2">主题分类</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveTopic('all')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTopic === 'all'
                        ? 'bg-stone-100 text-stone-900'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    全部分类
                  </button>
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setActiveTopic(topic)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTopic === topic
                          ? 'bg-stone-100 text-stone-900'
                          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <p className="text-label px-3 mb-3">数据统计</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="stat-card text-center">
                    <div className="stat-number">{stats.total}</div>
                    <div className="stat-label">总计</div>
                  </div>
                  <div className="stat-card text-center">
                    <div className="stat-number">{stats.day}</div>
                    <div className="stat-label">日报</div>
                  </div>
                  <div className="stat-card text-center">
                    <div className="stat-number">{stats.week}</div>
                    <div className="stat-label">周报</div>
                  </div>
                  <div className="stat-card text-center">
                    <div className="stat-number">{stats.month}</div>
                    <div className="stat-label">月报</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-stone-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-800 truncate">{session.user?.name}</div>
                    <div className="text-xs text-stone-400 truncate">{session.user?.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className={`flex-1 min-h-[calc(100vh-56px)] transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
          <div className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索报告..."
                  className="input-field pl-10"
                />
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn-primary flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                上传报告
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-16 text-center">
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-stone-400" />
                </div>
                <p className="text-stone-600 font-medium">暂无报告</p>
                <p className="text-stone-400 text-sm mt-1">点击上方按钮上传第一份报告</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="divide-y divide-stone-100">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                            {typeLabels[report.type as keyof typeof typeLabels]}
                          </span>
                          <span className="text-xs text-stone-400">{report.topic}</span>
                        </div>
                        <p className="font-medium text-stone-800 truncate">{report.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{report.createTime.split('T')[0]}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRead(report.id)}
                          className="btn-ghost p-2"
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(report)}
                          className="btn-ghost p-2"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="btn-ghost p-2 text-red-500 hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isUploadModalOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setIsUploadModalOpen(false)} />
          <div className="modal-content animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h3 className="font-semibold text-stone-900">上传报告</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">选择文件</label>
                <input
                  type="file"
                  accept=".html"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  className="w-full text-sm text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 file:transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">标题</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="报告标题"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">类型</label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="day">日报</option>
                  <option value="week">周报</option>
                  <option value="month">月报</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">主题</label>
                <input
                  type="text"
                  value={uploadForm.topic}
                  onChange={(e) => setUploadForm({ ...uploadForm, topic: e.target.value })}
                  placeholder="主题分类"
                  className="input-field"
                />
              </div>
              <button onClick={handleUpload} className="btn-primary w-full">
                确认上传
              </button>
            </div>
          </div>
        </>
      )}

      {isEditModalOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)} />
          <div className="modal-content animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h3 className="font-semibold text-stone-900">编辑报告</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">标题</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="报告标题"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">类型</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="day">日报</option>
                  <option value="week">周报</option>
                  <option value="month">月报</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">主题</label>
                <input
                  type="text"
                  value={editForm.topic}
                  onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                  placeholder="主题分类"
                  className="input-field"
                />
              </div>
              <button onClick={handleEdit} className="btn-primary w-full">
                保存修改
              </button>
            </div>
          </div>
        </>
      )}

      {isReadModalOpen && selectedReport && (
        <>
          <div className="modal-backdrop" onClick={() => setIsReadModalOpen(false)} />
          <div className="modal-content animate-slide-up max-w-5xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h3 className="font-medium text-stone-900">{selectedReport.title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {typeLabels[selectedReport.type as keyof typeof typeLabels]} · {selectedReport.topic}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsReadModalOpen(false)
                    openEditModal(selectedReport)
                  }}
                  className="btn-ghost text-sm flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedReport.id)
                    setIsReadModalOpen(false)
                  }}
                  className="btn-ghost text-sm text-red-500 hover:bg-red-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
                <button onClick={() => setIsReadModalOpen(false)} className="btn-ghost p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="h-[calc(85vh-73px)] overflow-auto p-6">
              <iframe
                srcDoc={selectedReport.content}
                className="w-full h-full min-h-[500px] border-none bg-white rounded-lg"
                title={selectedReport.title}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
