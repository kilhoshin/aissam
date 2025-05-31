import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

// Configure axios defaults - use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
axios.defaults.baseURL = API_BASE_URL
axios.defaults.withCredentials = true  // JWT 인증을 위해 true로 변경

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
      
      // 토큰이 만료되었거나 유효하지 않은 경우 로그아웃
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, logging out...')
        logout()
      }
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
      console.log('Sending registration data:', userData)
      const response = await axios.post('/register', userData)
      console.log('Registration successful:', response.data)
      
      // After successful registration, automatically log in
      const loginResult = await login(userData.email, userData.password)
      return loginResult
    } catch (error) {
      console.error('Registration failed:', error)
      console.error('Error response:', error.response?.data)
      
      // 더 구체적인 에러 메시지 제공
      let errorMessage = '회원가입에 실패했습니다.'
      
      if (error.response?.status === 400) {
        if (error.response.data?.detail === 'Email already registered') {
          errorMessage = '이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.'
        } else {
          errorMessage = error.response.data?.detail || '입력 정보를 확인해주세요.'
        }
      } else if (error.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
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
