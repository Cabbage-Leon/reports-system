'use client'

import { useMemo } from 'react'
import { FileText, FileCode, FileJson, AlertCircle } from 'lucide-react'

interface MultiFormatPreviewProps {
  content: string
  format: string
  title: string
}

export function MultiFormatPreview({ content, format, title }: MultiFormatPreviewProps) {
  const renderedContent = useMemo(() => {
    switch (format) {
      case 'html':
        return {
          type: 'html' as const,
          content: content,
        }

      case 'markdown':
        return {
          type: 'html' as const,
          content: convertMarkdownToHtml(content),
        }

      case 'pdf':
        return {
          type: 'iframe' as const,
          content: content,
        }

      case 'doc':
      case 'docx':
        return {
          type: 'html' as const,
          content: `<div style="padding: 20px; font-family: Arial, sans-serif; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(content)}</div>`,
        }

      case 'spreadsheet':
        return {
          type: 'html' as const,
          content: `<div style="padding: 20px; font-family: monospace; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(content)}</div>`,
        }

      default:
        return {
          type: 'text' as const,
          content: content,
        }
    }
  }, [content, format])

  if (renderedContent.type === 'iframe') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-50">
        <div className="text-center p-8 max-w-md">
          <FileJson className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-stone-700 mb-2">PDF 文件</h3>
          <p className="text-sm text-stone-500 mb-4">PDF 文件需要下载后查看</p>
          <a
            href={renderedContent.content}
            download={`${title}.pdf`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <FileText className="w-4 h-4" />
            下载 PDF
          </a>
        </div>
      </div>
    )
  }

  if (renderedContent.type === 'text') {
    return (
      <div className="w-full h-full overflow-auto bg-white p-6">
        <pre className="whitespace-pre-wrap font-mono text-sm text-stone-700 leading-relaxed">
          {renderedContent.content}
        </pre>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto bg-white">
      <iframe
        srcDoc={renderedContent.content}
        className="w-full h-full border-none bg-white"
        title={title}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

function convertMarkdownToHtml(markdown: string): string {
  let html = markdown

  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: #1f2937;">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.3em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: #111827;">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 1.5em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; color: #111827;">$1</h1>')

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
  html = html.replace(/`{3}([\s\S]*?)`{3}/g, '<pre style="background-color: #f3f4f6; padding: 1em; border-radius: 0.5em; overflow-x: auto;"><code>$1</code></pre>')
  html = html.replace(/`(.*?)`/g, '<code style="background-color: #f3f4f6; padding: 0.2em 0.4em; border-radius: 0.25em; font-family: monospace;">$1</code>')

  html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left: 4px solid #d1d5db; padding-left: 1em; margin: 1em 0; color: #6b7280; font-style: italic;">$1</blockquote>')

  html = html.replace(/^\- (.*$)/gim, '<li style="margin: 0.5em 0;">$1</li>')
  html = html.replace(/(<li.*<\/li>)/g, '<ul style="margin: 1em 0; padding-left: 2em;">$1</ul>')

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3b82f6; text-decoration: underline;">$1</a>')

  html = html.replace(/\n\n/g, '</p><p style="margin: 1em 0; line-height: 1.7;">')
  html = html.replace(/\n/g, '<br />')

  html = `<div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #374151; max-width: 900px; margin: 0 auto;">
    <p style="margin: 1em 0; line-height: 1.7;">${html}</p>
  </div>`

  return html
}

export default MultiFormatPreview
