'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ErrorToastProps {
  message: string
  onClose: () => void
  duration?: number
}

export function ErrorToast({ message, onClose, duration = 5000 }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`fixed top-6 right-6 z-50 transform transition-all duration-300 ease-out ${
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg min-w-[300px] max-w-[400px]">
        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">操作失败</p>
          <p className="text-xs text-red-600 truncate mt-0.5">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsLeaving(true)
            setTimeout(onClose, 300)
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-red-100 transition-colors"
        >
          <X className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  errors: string[]
  onRemove: (index: number) => void
}

export function ToastContainer({ errors, onRemove }: ToastContainerProps) {
  return (
    <>
      {errors.map((error, index) => (
        <ErrorToast
          key={index}
          message={error}
          onClose={() => onRemove(index)}
        />
      ))}
    </>
  )
}