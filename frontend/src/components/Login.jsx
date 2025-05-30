import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Mail, Lock, Eye, EyeOff, Sparkles, GraduationCap, Bot } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 p-2 rounded-full shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            AISSAM
          </h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            AI 개인 과외 로그인
          </h2>
          <div className="flex items-center justify-center space-x-2 text-purple-600">
            <Bot className="h-5 w-5" />
            <p className="text-sm font-medium">
              24시간 언제나 함께하는 AI 선생님
            </p>
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        
        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  {error}
                </div>
              </div>
            )}
            
            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  이메일 주소
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-purple-400 group-focus-within:text-purple-600 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full px-4 py-4 pl-12 border-2 border-purple-200 placeholder-purple-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-purple-300 shadow-lg"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-purple-400 group-focus-within:text-purple-600 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="appearance-none relative block w-full px-4 py-4 pl-12 pr-12 border-2 border-purple-200 placeholder-purple-300 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm bg-white/70 backdrop-blur-sm transition-all duration-300 hover:border-purple-300 shadow-lg"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-purple-50/50 rounded-r-2xl transition-all duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-purple-400 hover:text-purple-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-purple-400 hover:text-purple-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></div>
                    </div>
                    <span className="ml-2">로그인 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>로그인</span>
                    <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                )}
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center pt-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200/50 shadow-lg">
                <span className="text-gray-600">처음 방문하시나요? </span>
                <Link
                  to="/register"
                  className="font-semibold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 inline-block"
                >
                  회원가입하기 →
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* Features Section */}
        <div className="text-center">
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/50 hover:scale-105 transition-all duration-300">
              <div className="text-2xl mb-2">🤖</div>
              <p className="text-xs font-medium text-gray-700">AI 튜터</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/50 hover:scale-105 transition-all duration-300">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-xs font-medium text-gray-700">맞춤 학습</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/50 hover:scale-105 transition-all duration-300">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-xs font-medium text-gray-700">24시간</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
