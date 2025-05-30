import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Send, Image, ArrowLeft, GraduationCap, Upload, X, Sparkles, Bot, User, Camera } from 'lucide-react'
import axios from 'axios'
import MathRenderer from './MathRenderer'

export default function Chat() {
  const { sessionId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    fetchSession()
    fetchMessages()
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No token found')
        navigate('/login')
        return
      }
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }
      const response = await axios.get(`/chat-sessions/${sessionId}`, config)
      setSession(response.data)
    } catch (error) {
      console.error('Error fetching session:', error)
      // 임시 세션 데이터 설정
      setSession({
        id: sessionId,
        title: "AI 튜터와의 대화",
        subject: { name: "학습", color: "#8B5CF6" }
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No token found')
        navigate('/login')
        return
      }
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }
      const response = await axios.get(`/chat-sessions/${sessionId}/messages`, config)
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || sending) return

    setSending(true)
    
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No token found')
        navigate('/login')
        return
      }
      
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      }
      const formData = new FormData()
      formData.append('content', newMessage.trim())
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      const response = await axios.post(`/chat-sessions/${sessionId}/messages`, formData, config)

      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        content: newMessage.trim(),
        is_user: true,
        created_at: new Date().toISOString(),
        image_url: imagePreview
      }
      
      setMessages(prev => [...prev, userMessage])
      setNewMessage('')
      removeImage()

      // Add AI response
      if (response.data) {
        setMessages(prev => [...prev, response.data])
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error)
      console.error('📋 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      })
      console.error('📤 Request details:', {
        url: `/chat-sessions/${sessionId}/messages`,
        formData: {
          content: newMessage.trim(),
          hasImage: !!selectedImage,
          imageType: selectedImage?.type,
          imageSize: selectedImage?.size
        }
      })
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('Authentication failed, redirecting to login')
        localStorage.removeItem('token')
        navigate('/login')
      } else if (error.response?.status === 422) {
        console.error('Validation error:', error.response?.data)
        alert(`입력 검증 오류: ${JSON.stringify(error.response?.data?.detail || '알 수 없는 오류')}`)
      } else {
        // Show error message to user
        alert('메시지 전송에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium text-lg">AI 선생님과 연결중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-purple-200/50 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="mr-4 p-3 hover:bg-purple-50 rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-6 w-6 text-purple-600" />
              </Link>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg">
                {session?.subject?.icon === 'calculator' ? (
                  <span className="text-xl">📐</span>
                ) : session?.subject?.icon === 'globe' ? (
                  <span className="text-xl">🔤</span>
                ) : session?.subject?.icon === 'book' ? (
                  <span className="text-xl">📚</span>
                ) : session?.subject?.icon === 'building' ? (
                  <span className="text-xl">🏛️</span>
                ) : session?.subject?.icon === 'beaker' ? (
                  <span className="text-xl">🔬</span>
                ) : (
                  <GraduationCap className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {session?.subject?.name || '과목'} AI 튜터
                </h1>
                <p className="text-sm text-purple-600 font-medium flex items-center">
                  <Sparkles className="h-4 w-4 mr-1" />
                  24시간 개인 맞춤 학습
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-green-700 text-sm font-medium">• 온라인</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-lg">
              <Bot className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              안녕하세요! 😊
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              저는 <span className="font-semibold text-purple-600">{session?.subject?.name}</span> AI 튜터입니다.<br />
              무엇이든 질문해주세요!
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-3xl max-w-lg mx-auto border border-purple-200/50 shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
                <span className="font-bold text-purple-700">학습 팁</span>
              </div>
              <p className="text-purple-800 leading-relaxed">
                📸 <strong>사진 업로드:</strong> 갤러리에서 문제 사진을 선택하세요<br />
                📱 <strong>카메라 촬영:</strong> 바로 카메라로 문제를 찍어보세요<br />
                ✨ <strong>단계별 질문:</strong> 모르는 부분을 구체적으로 물어보세요<br />
                🎯 <strong>개념 정리:</strong> 이해가 안 되는 개념을 설명해드려요
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.is_user ? 'justify-end' : 'justify-start'} ${index === 0 ? 'mt-0' : ''}`}
            >
              {!message.is_user && (
                <div className="mr-3 mt-1">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
              <div
                className={`${
                  message.is_user 
                    ? 'max-w-xs lg:max-w-md' 
                    : 'max-w-md lg:max-w-2xl xl:max-w-4xl'
                } px-6 py-4 rounded-3xl shadow-lg ${
                  message.is_user
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/90 backdrop-blur-sm text-gray-900 border border-purple-200/50'
                }`}
                style={{ wordBreak: 'break-word' }}
              >
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt="Uploaded"
                    className="w-full rounded-2xl mb-3 shadow-md"
                  />
                )}
                {message.content && (
                  <MathRenderer content={message.content} />
                )}
                <p
                  className={`text-xs mt-2 ${
                    message.is_user ? 'text-purple-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.created_at)}
                </p>
              </div>
              {message.is_user && (
                <div className="ml-3 mt-1">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-6 py-4 bg-white/90 backdrop-blur-sm border-t border-purple-200/50">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-24 w-24 object-cover rounded-2xl shadow-lg border-2 border-purple-200"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-300 hover:scale-110 shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={sendMessage} className="bg-white/90 backdrop-blur-md border-t border-purple-200/50 p-6">
        <div className="flex items-end space-x-3">
          {/* Gallery Image Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg bg-white border border-purple-200"
            title="갤러리에서 사진 선택"
          >
            <Image className="h-6 w-6" />
          </button>
          
          {/* Camera Capture */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="p-4 text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg bg-white border border-pink-200"
            title="카메라로 사진 촬영"
          >
            <Camera className="h-6 w-6" />
          </button>
          
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="AI 튜터에게 질문하세요... 📝"
              className="w-full p-4 border-2 border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white/90 backdrop-blur-sm text-gray-900 placeholder-purple-400 shadow-lg"
              rows={1}
              style={{ maxHeight: '120px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(e)
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedImage) || sending}
            className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {sending ? (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></div>
              </div>
            ) : (
              <Send className="h-6 w-6" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
