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
  UploadCloud,
  RefreshCw,
  Clock,
  ToggleLeft,
  ToggleRight,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
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

interface FeishuSyncConfig {
  id: string
  enabled: boolean
  appId: string
  appSecret: string
  folderToken: string | null
  syncTime: string
  reportType: string
  topic: string
  createdAt: string
  updatedAt: string
  lastSyncTime: string | null
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
  const [isDragging, setIsDragging] = useState(false)
  const [currentView, setCurrentView] = useState<'reports' | 'sync'>('reports')

  const [feishuConfigs, setFeishuConfigs] = useState<FeishuSyncConfig[]>([])
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<FeishuSyncConfig | null>(null)
  const [syncLoading, setSyncLoading] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const [syncForm, setSyncForm] = useState({
    appId: '',
    appSecret: '',
    folderToken: '',
    syncTime: '09:00',
    syncRange: 'today',
    syncDays: '1',
    reportType: 'day',
    topic: '飞书同步',
    enabled: true,
  })

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

  const fetchFeishuConfigs = async () => {
    const res = await fetch('/api/sync/feishu')
    if (res.ok) {
      const data = await res.json()
      setFeishuConfigs(data)
    }
  }

  const handleCreateConfig = async () => {
    if (!syncForm.appId || !syncForm.appSecret) {
      alert('请填写 App ID 和 App Secret')
      return
    }

    const res = await fetch('/api/sync/feishu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...syncForm }),
    })

    if (res.ok) {
      setIsSyncModalOpen(false)
      setEditingConfig(null)
      setSyncForm({
        appId: '',
        appSecret: '',
        folderToken: '',
        syncTime: '09:00',
        syncRange: 'today',
        syncDays: '1',
        reportType: 'day',
        topic: '飞书同步',
        enabled: true,
      })
      fetchFeishuConfigs()
    } else {
      const data = await res.json()
      alert(data.error || '创建失败')
    }
  }

  const handleUpdateConfig = async (id: string) => {
    const res = await fetch('/api/sync/feishu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...syncForm }),
    })

    if (res.ok) {
      setIsSyncModalOpen(false)
      setEditingConfig(null)
      setSyncForm({
        appId: '',
        appSecret: '',
        folderToken: '',
        syncTime: '09:00',
        syncRange: 'today',
        syncDays: '1',
        reportType: 'day',
        topic: '飞书同步',
        enabled: true,
      })
      fetchFeishuConfigs()
    } else {
      alert('更新失败')
    }
  }

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('确定删除该配置？')) return

    const res = await fetch(`/api/sync/feishu?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchFeishuConfigs()
    } else {
      alert('删除失败')
    }
  }

  const handleToggleConfig = async (config: FeishuSyncConfig) => {
    const res = await fetch('/api/sync/feishu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: config.id, enabled: !config.enabled }),
    })

    if (res.ok) {
      fetchFeishuConfigs()
    }
  }

  const handleTestSync = async (configId: string) => {
    setSyncLoading(configId)
    setSyncResult(null)

    const res = await fetch('/api/sync/feishu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', configId }),
    })

    const data = await res.json()
    setSyncResult(data)
    setSyncLoading(null)
    fetchFeishuConfigs()
  }

  const openEditConfigModal = (config: FeishuSyncConfig) => {
    setEditingConfig(config)
    setSyncForm({
      appId: config.appId,
      appSecret: config.appSecret,
      folderToken: config.folderToken || '',
      syncTime: config.syncTime,
      syncRange: (config as any).syncRange || 'today',
      syncDays: String((config as any).syncDays || 1),
      reportType: config.reportType,
      topic: config.topic,
      enabled: config.enabled,
    })
    setIsSyncModalOpen(true)
  }

  const openCreateConfigModal = () => {
    setEditingConfig(null)
    setSyncForm({
      appId: '',
      appSecret: '',
      folderToken: '',
      syncTime: '09:00',
      syncRange: 'today',
      syncDays: '1',
      reportType: 'day',
      topic: '飞书同步',
      enabled: true,
    })
    setIsSyncModalOpen(true)
  }

  const parseHTMLContent = (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    let title = ''
    const h1Title = doc.querySelector('h1')?.textContent?.trim()
    const titleTag = doc.querySelector('title')?.textContent?.trim()
    if (h1Title) title = h1Title
    else if (titleTag) title = titleTag

    const text = doc.body.textContent || ''
    let inferredType = 'week'
    if (text.includes('日报') || text.includes('每日') || /(日|day)/i.test(title)) {
      inferredType = 'day'
    } else if (text.includes('月报') || text.includes('月度') || /(月|month)/i.test(title)) {
      inferredType = 'month'
    }

    let inferredTopic = ''
    const topicMatch = text.match(/主题[：:]\s*(.+?)(?:\n|$)/)
    if (topicMatch) {
      inferredTopic = topicMatch[1].trim()
    } else if (topics.length > 0) {
      for (const t of topics) {
        if (text.includes(t)) {
          inferredTopic = t
          break
        }
      }
    }

    return { title, type: inferredType, topic: inferredTopic }
  }

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setUploadForm({ ...uploadForm, file: null })
      return
    }

    let autoTitle = file.name.replace(/\.html$/i, '')
    let autoType = 'week'
    let autoTopic = ''

    try {
      const content = await file.text()
      const parsed = parseHTMLContent(content)
      autoTitle = parsed.title || autoTitle
      autoType = parsed.type
      autoTopic = parsed.topic
    } catch (e) {
      console.error('Failed to parse HTML file:', e)
    }

    if (!autoTopic && topics.length > 0) {
      autoTopic = topics[0]
    }

    setUploadForm({
      title: autoTitle,
      type: autoType,
      topic: autoTopic,
      file: file,
    })
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0] || null
    if (file?.name.endsWith('.html')) {
      await handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
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

  useEffect(() => {
    refreshData()
    if (currentView === 'sync') {
      fetchFeishuConfigs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, activeTopic, keyword])

  useEffect(() => {
    if (currentView === 'sync') {
      fetchFeishuConfigs()
    }
  }, [currentView])

  const openUploadModal = () => {
    setUploadForm({
      title: '',
      type: 'week',
      topic: topics.length > 0 ? topics[0] : '',
      file: null,
    })
    setIsUploadModalOpen(true)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
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
              <Menu className="w-4 h-4 text-stone-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-stone-900 rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-semibold">档</span>
              </div>
              <span className="font-medium text-stone-800 text-sm hidden sm:block">管理后台</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="btn-secondary text-xs hidden sm:flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              访问首页
            </a>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-ghost text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏遮罩层 - 仅在移动端显示 */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* 侧边栏 */}
        <aside className={`
          fixed lg:sticky top-14 left-0 h-[calc(100vh-56px)]
          transition-all duration-300 z-30
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
          lg:w-60 lg:translate-x-0
        `}>
          <div className="h-full bg-white border-r border-stone-200 overflow-y-auto w-64">
            <div className="p-4 space-y-6">
              {/* 移动端关闭按钮 */}
              <div className="lg:hidden flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-stone-400">菜单</span>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 hover:bg-stone-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              <div>
                <p className="text-label px-2 mb-2">功能菜单</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setCurrentView('reports')
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      currentView === 'reports'
                        ? 'bg-stone-100 text-stone-900'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    报告管理
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('sync')
                      setSidebarOpen(false)
                      fetchFeishuConfigs()
                    }}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      currentView === 'sync'
                        ? 'bg-stone-100 text-stone-900'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    飞书同步
                  </button>
                </div>
              </div>

              {currentView === 'reports' && (
              <>
              <div>
                <p className="text-label px-2 mb-2">报告类型</p>
                <div className="space-y-0.5">
                  {[
                    { value: 'all', label: '全部', icon: Layers },
                    { value: 'day', label: '日报', icon: Layers },
                    { value: 'week', label: '周报', icon: Layers },
                    { value: 'month', label: '月报', icon: Layers },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setActiveType(item.value)
                        setSidebarOpen(false) // 移动端点击后关闭侧边栏
                      }}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        activeType === item.value
                          ? 'bg-stone-100 text-stone-900'
                          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-label px-2 mb-2">主题分类</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveTopic('all')
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      activeTopic === 'all'
                        ? 'bg-stone-100 text-stone-900'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    全部分类
                  </button>
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setActiveTopic(topic)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        activeTopic === topic
                          ? 'bg-stone-100 text-stone-900'
                          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <p className="text-label px-2 mb-3">数据统计</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="stat-card text-center p-3">
                    <div className="stat-number text-lg">{stats.total}</div>
                    <div className="stat-label">总计</div>
                  </div>
                  <div className="stat-card text-center p-3">
                    <div className="stat-number text-lg">{stats.day}</div>
                    <div className="stat-label">日报</div>
                  </div>
                  <div className="stat-card text-center p-3">
                    <div className="stat-number text-lg">{stats.week}</div>
                    <div className="stat-label">周报</div>
                  </div>
                  <div className="stat-card text-center p-3">
                    <div className="stat-number text-lg">{stats.month}</div>
                    <div className="stat-label">月报</div>
                  </div>
                </div>
              </div>
              </>
              )}

              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-stone-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-stone-800 truncate">{session.user?.name}</div>
                    <div className="text-[10px] text-stone-400 truncate">{session.user?.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className={`flex-1 min-h-[calc(100vh-56px)] transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
          {currentView === 'reports' ? (
          <div className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索报告..."
                  className="input-field pl-9 text-sm"
                />
              </div>
              <button
                onClick={openUploadModal}
                className="btn-primary flex items-center justify-center gap-2 flex-shrink-0 text-sm"
              >
                <Plus className="w-4 h-4" />
                上传报告
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-stone-400" />
                </div>
                <p className="text-stone-600 font-medium text-sm">暂无报告</p>
                <p className="text-stone-400 text-xs mt-1">点击上方按钮上传第一份报告</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="divide-y divide-stone-100">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center gap-3.5 p-3.5 hover:bg-stone-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0" onClick={() => handleRead(report.id)}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                            {typeLabels[report.type as keyof typeof typeLabels]}
                          </span>
                          <span className="text-[10px] text-stone-400">{report.topic}</span>
                        </div>
                        <p className="font-medium text-stone-800 truncate text-sm">{report.title}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{report.createTime.split('T')[0]}</p>
                      </div>
                      <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRead(report.id)
                          }}
                          className="btn-ghost p-2 sm:p-1.5"
                          title="查看"
                        >
                          <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(report)
                          }}
                          className="btn-ghost p-2 sm:p-1.5"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(report.id)
                          }}
                          className="btn-ghost p-2 sm:p-1.5 text-red-500 hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          ) : (
          <div className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                飞书文档同步配置
              </h2>
              <button
                onClick={openCreateConfigModal}
                className="btn-primary flex items-center justify-center gap-2 flex-shrink-0 text-sm ml-auto"
              >
                <Plus className="w-4 h-4" />
                添加配置
              </button>
            </div>

            {syncResult && (
              <div className={`mb-4 p-4 rounded-lg border ${
                syncResult.failed === 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {syncResult.failed === 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    syncResult.failed === 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    同步完成：成功 {syncResult.success}，失败 {syncResult.failed}
                  </span>
                </div>
                {syncResult.errors.length > 0 && (
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {syncResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => setSyncResult(null)}
                  className="mt-2 text-xs text-stone-500 hover:text-stone-700"
                >
                  关闭
                </button>
              </div>
            )}

            {feishuConfigs.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Settings className="w-5 h-5 text-stone-400" />
                </div>
                <p className="text-stone-600 font-medium text-sm">暂无同步配置</p>
                <p className="text-stone-400 text-xs mt-1">点击上方按钮添加第一个飞书同步配置</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feishuConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="bg-white rounded-xl border border-stone-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            config.enabled 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {config.enabled ? '已启用' : '已禁用'}
                          </span>
                          <span className="text-xs text-stone-400">
                            {config.reportType === 'day' ? '日报' : config.reportType === 'week' ? '周报' : '月报'}
                          </span>
                        </div>
                        <p className="font-medium text-stone-800 text-sm mb-1">
                          App ID: <span className="font-mono">{config.appId}</span>
                        </p>
                        <p className="text-xs text-stone-500 mb-2">
                          主题: {config.topic}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            同步时间: {config.syncTime}
                          </span>
                          <span className="flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded">
                            {(config as any).syncRange === 'today' ? '当天' : 
                             (config as any).syncRange === 'this_week' ? '本周' : 
                             `近${(config as any).syncDays || 1}天`}
                          </span>
                          {config.lastSyncTime && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              上次同步: {new Date(config.lastSyncTime).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleConfig(config)}
                          className={`btn-ghost p-2 ${config.enabled ? 'text-green-600' : 'text-stone-400'}`}
                          title={config.enabled ? '禁用' : '启用'}
                        >
                          {config.enabled ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleTestSync(config.id)}
                          disabled={syncLoading === config.id || !config.enabled}
                          className="btn-ghost p-2 disabled:opacity-50"
                          title="测试同步"
                        >
                          {syncLoading === config.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditConfigModal(config)}
                          className="btn-ghost p-2"
                          title="编辑"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="btn-ghost p-2 text-red-500 hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </main>
      </div>

      {isUploadModalOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setIsUploadModalOpen(false)} />
          <div className="modal-content animate-slide-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-stone-100 flex-shrink-0">
              <h3 className="font-semibold text-stone-900 text-sm">上传报告</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">选择文件</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-stone-400 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  } ${uploadForm.file ? 'border-stone-300 bg-stone-50' : ''}`}
                >
                  <input
                    type="file"
                    accept=".html"
                    id="file-input"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <UploadCloud className="w-7 h-7 text-stone-400 mx-auto mb-2" />
                    {uploadForm.file ? (
                      <div>
                        <p className="text-xs text-stone-600 font-medium break-all">{uploadForm.file.name}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">点击更换文件</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-stone-600">拖拽文件到此处，或点击选择</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">支持 .html 文件</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">标题</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="报告标题"
                  className="input-field text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">类型</label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="day">日报</option>
                    <option value="week">周报</option>
                    <option value="month">月报</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">主题</label>
                  {topics.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={uploadForm.topic}
                        onChange={(e) => setUploadForm({ ...uploadForm, topic: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="">选择现有主题...</option>
                        {topics.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-stone-400">或者直接在下方输入新主题</p>
                    </div>
                  ) : null}
                  <input
                    type="text"
                    value={uploadForm.topic}
                    onChange={(e) => setUploadForm({ ...uploadForm, topic: e.target.value })}
                    placeholder="主题分类"
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <button onClick={handleUpload} className="btn-primary w-full text-sm flex-shrink-0">
                确认上传
              </button>
            </div>
          </div>
        </>
      )}

      {isEditModalOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)} />
          <div className="modal-content animate-slide-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-stone-100 flex-shrink-0">
              <h3 className="font-semibold text-stone-900 text-sm">编辑报告</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">标题</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="报告标题"
                  className="input-field text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">类型</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="day">日报</option>
                    <option value="week">周报</option>
                    <option value="month">月报</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">主题</label>
                  {topics.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={editForm.topic}
                        onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="">选择现有主题...</option>
                        {topics.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-stone-400">或者直接在下方输入新主题</p>
                    </div>
                  ) : null}
                  <input
                    type="text"
                    value={editForm.topic}
                    onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                    placeholder="主题分类"
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <button onClick={handleEdit} className="btn-primary w-full text-sm">
                保存修改
              </button>
            </div>
          </div>
        </>
      )}

      {isReadModalOpen && selectedReport && (
        <>
          <div className="modal-backdrop" onClick={() => setIsReadModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-stone-100 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-stone-900 text-sm truncate">{selectedReport.title}</h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {typeLabels[selectedReport.type as keyof typeof typeLabels]} · {selectedReport.topic}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsReadModalOpen(false)
                    openEditModal(selectedReport)
                  }}
                  className="btn-ghost text-xs flex items-center gap-1.5 px-2.5 py-1.5 sm:px-2 sm:py-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">编辑</span>
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedReport.id)
                    setIsReadModalOpen(false)
                  }}
                  className="btn-ghost text-xs text-red-500 hover:bg-red-50 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-2 sm:py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">删除</span>
                </button>
                <button onClick={() => setIsReadModalOpen(false)} className="btn-ghost p-1.5 sm:p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
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

      {isSyncModalOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setIsSyncModalOpen(false)} />
          <div className="modal-content animate-slide-up max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-stone-100 flex-shrink-0">
              <h3 className="font-semibold text-stone-900 text-sm">
                {editingConfig ? '编辑同步配置' : '添加同步配置'}
              </h3>
              <button onClick={() => setIsSyncModalOpen(false)} className="btn-ghost p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  App ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={syncForm.appId}
                  onChange={(e) => setSyncForm({ ...syncForm, appId: e.target.value })}
                  placeholder="飞书应用的 App ID"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  App Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={syncForm.appSecret}
                  onChange={(e) => setSyncForm({ ...syncForm, appSecret: e.target.value })}
                  placeholder="飞书应用的 App Secret"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  文件夹 Token（可选）
                </label>
                <input
                  type="text"
                  value={syncForm.folderToken}
                  onChange={(e) => setSyncForm({ ...syncForm, folderToken: e.target.value })}
                  placeholder="飞书文件夹 Token，不填则同步根目录"
                  className="input-field text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">同步时间</label>
                  <input
                    type="time"
                    value={syncForm.syncTime}
                    onChange={(e) => setSyncForm({ ...syncForm, syncTime: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">报告类型</label>
                  <select
                    value={syncForm.reportType}
                    onChange={(e) => setSyncForm({ ...syncForm, reportType: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="day">日报</option>
                    <option value="week">周报</option>
                    <option value="month">月报</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">同步范围</label>
                <select
                  value={syncForm.syncRange}
                  onChange={(e) => setSyncForm({ ...syncForm, syncRange: e.target.value })}
                  className="input-field text-sm mb-2"
                >
                  <option value="today">当天</option>
                  <option value="this_week">本周</option>
                  <option value="custom">自定义天数</option>
                </select>
                {syncForm.syncRange === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={syncForm.syncDays}
                    onChange={(e) => setSyncForm({ ...syncForm, syncDays: e.target.value })}
                    placeholder="天数"
                    className="input-field text-sm"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">主题分类</label>
                <input
                  type="text"
                  value={syncForm.topic}
                  onChange={(e) => setSyncForm({ ...syncForm, topic: e.target.value })}
                  placeholder="同步文档的主题标签"
                  className="input-field text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSyncForm({ ...syncForm, enabled: !syncForm.enabled })}
                  className="flex items-center gap-2 text-sm text-stone-600"
                >
                  {syncForm.enabled ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-stone-400" />
                  )}
                  <span>启用自动同步</span>
                </button>
              </div>
              <button
                onClick={() => editingConfig ? handleUpdateConfig(editingConfig.id) : handleCreateConfig()}
                className="btn-primary w-full text-sm flex-shrink-0"
              >
                {editingConfig ? '保存修改' : '创建配置'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
