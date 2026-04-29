'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Eye, Shield, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/admin',
    })

    if (result?.error) {
      setError('邮箱或密码错误')
    } else {
      router.push('/admin')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-indigo-200 rounded-3xl blur-3xl"></div>
        
        <div className="relative glass-card rounded-3xl p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-2">报告管理后台</h1>
            <p className="text-gray-500">请登录以管理您的报告</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  登录中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  登录
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 text-center">
              默认账号: <span className="font-medium text-gray-700">admin@example.com</span> / <span className="font-medium text-gray-700">password</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
