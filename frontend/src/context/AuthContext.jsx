import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

// Configure axios defaults - use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = false  // CORS 설정과 맞춤

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/me')
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      const response = await axios.post('/token', formData)
      const { access_token } = response.data

      setToken(access_token)
      localStorage.setItem('token', access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      await fetchUser()
      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        error: error.response?.data?.detail || '로그인에 실패했습니다.' 
      }
    }
  }

  const register = async (userData) => {
    try {
      console.log('🔄 Registration attempt:', { email: userData.email, grade: userData.grade })
      const response = await axios.post('/register', userData)
      console.log('✅ Registration successful:', response.data)
      
      // After successful registration, automatically log in
      const loginResult = await login(userData.email, userData.password)
      return loginResult
    } catch (error) {
      console.error('❌ Registration failed:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      })
      
      let errorMessage = '회원가입에 실패했습니다.'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.status === 400) {
        errorMessage = '입력 정보를 확인해주세요.'
      } else if (error.response?.status === 409) {
        errorMessage = '이미 등록된 이메일입니다.'
      } else if (error.response?.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = '네트워크 연결을 확인해주세요.'
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
