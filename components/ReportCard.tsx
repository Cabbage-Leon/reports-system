import { FileText, ArrowRight } from 'lucide-react'

interface ReportCardProps {
  id: string
  title: string
  type: string
  typeText: string
  topic: string
  createTime: string
  onClick: (id: string) => void
}

export default function ReportCard({
  id,
  title,
  type,
  typeText,
  topic,
  createTime,
  onClick,
}: ReportCardProps) {
  const typeColor = type === 'day' 
    ? 'bg-green-100 text-green-700' 
    : type === 'week' 
      ? 'bg-blue-100 text-blue-700' 
      : 'bg-orange-100 text-orange-700'

  return (
    <div className="article-card p-6">
      <div className="flex justify-between items-start mb-4">
        <span className={`badge ${typeColor}`}>{typeText}</span>
        <span className="text-sm text-gray-400">{createTime}</span>
      </div>
      <h3 className="text-lg font-semibold mb-3 line-clamp-2">{title}</h3>
      <div className="text-sm text-gray-500 mb-5 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <span>{topic}</span>
      </div>
      <button
        onClick={() => onClick(id)}
        className="text-primary font-medium flex items-center gap-1 text-sm hover:underline"
      >
        阅读全文 <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
