import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, MessageSquare, Users, TrendingUp, LogOut, Plus, Clock, Star, ArrowRight, GraduationCap } from 'lucide-react'
import axios from 'axios'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [chatSessions, setChatSessions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [subjectsRes, sessionsRes] = await Promise.all([
        axios.get('/subjects', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/chat-sessions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setSubjects(subjectsRes.data)
      setChatSessions(sessionsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      // 임시로 기본 과목 데이터 설정
      setSubjects([
        { id: 1, name: '수학', icon: 'calculator', color: '#8B5CF6' },
        { id: 2, name: '국어', icon: 'book', color: '#F59E0B' },
        { id: 3, name: '영어', icon: 'globe', color: '#10B981' },
        { id: 4, name: '사회', icon: 'building', color: '#EF4444' },
        { id: 5, name: '과학', icon: 'beaker', color: '#3B82F6' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const createNewSession = async (subjectId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/chat-sessions', 
        { subject_id: subjectId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      navigate(`/chat/${response.data.id}`)
    } catch (error) {
      console.error('Error creating session:', error)
      // 임시로 새 세션 ID 생성해서 채팅으로 이동
      const tempSessionId = Date.now()
      navigate(`/chat/${tempSessionId}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-600 font-medium">로딩중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-purple-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-xl">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AISSAM
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-600">
                안녕하세요, <span className="font-semibold text-purple-700">{user?.email}</span>님
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-purple-700 transition-colors px-3 py-2 rounded-lg hover:bg-purple-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center relative">
            {/* Floating illustrations */}
            <div className="absolute top-0 left-10 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute top-10 right-20 w-16 h-16 bg-pink-200 rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-indigo-200 rounded-full opacity-25 animate-bounce delay-150"></div>
            
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI와 함께
              </span>
              <br />
              <span className="text-gray-800">
                언제 어디서나 쉽게
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              대입 준비를 위한 당신만의 AI 과외쌤과 함께<br />
              <span className="font-semibold text-purple-600">24시간 언제든지</span> 질문하고 배워보세요
            </p>
            
            <button 
              onClick={() => createNewSession(subjects[0]?.id)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 mb-12"
            >
              학습 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>

            {/* Happy Learners */}
            <div className="flex items-center justify-center space-x-4 mb-16">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-white font-bold">👨</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border-2 border-white flex items-center justify-center text-white font-bold">👩</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-red-400 border-2 border-white flex items-center justify-center text-white font-bold">👨</div>
              </div>
              <div className="text-yellow-400 flex">
                {'★'.repeat(5)}
              </div>
              <span className="text-gray-600 font-medium">{chatSessions.length}+ 만족한 학생들</span>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{chatSessions.length}</h3>
                <p className="text-gray-600 font-medium">완료한 대화 세션</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">5</h3>
                <p className="text-gray-600 font-medium">수능 필수 과목</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl mx-auto mb-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">24/7</h3>
                <p className="text-gray-600 font-medium">AI 튜터 지원</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Subject Cards */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">과목별 학습 시작</h2>
          <p className="text-xl text-gray-600 mb-12 text-center">원하는 과목을 선택해서 AI 튜터와 대화를 시작하세요</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {subjects.map((subject, index) => (
              <div
                key={subject.id}
                className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 cursor-pointer overflow-hidden border border-gray-100"
                onClick={() => createNewSession(subject.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center text-3xl shadow-lg"
                       style={{ backgroundColor: `${subject.color}15`, border: `3px solid ${subject.color}30` }}>
                    {subject.icon === 'calculator' ? '📐' : 
                     subject.icon === 'globe' ? '🔤' : 
                     subject.icon === 'book' ? '📚' :
                     subject.icon === 'building' ? '🏛️' :
                     subject.icon === 'beaker' ? '🔬' : '📖'}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{subject.name}</h3>
                  <p className="text-sm text-gray-600 mb-6">AI 튜터와 함께 학습</p>
                  
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all group-hover:shadow-lg"
                       style={{ 
                         backgroundColor: `${subject.color}15`, 
                         color: subject.color,
                         border: `2px solid ${subject.color}30`
                       }}>
                    시작하기
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Conversations */}
        <section>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">최근 대화</h2>
          <p className="text-xl text-gray-600 mb-12 text-center">이전 학습 세션을 계속해보세요</p>
          
          {chatSessions.length > 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-purple-200/50">
              {chatSessions.slice(0, 5).map((session, index) => (
                <div
                  key={session.id}
                  className={`group p-8 hover:bg-purple-50/50 cursor-pointer transition-all duration-300 ${
                    index !== chatSessions.length - 1 && index !== 4 ? 'border-b border-gray-100' : ''
                  }`}
                  onClick={() => navigate(`/chat/${session.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl shadow-lg"
                           style={{ backgroundColor: `${session.subject?.color}15` }}>
                        {session.subject?.icon === 'calculator' ? '📐' : 
                          session.subject?.icon === 'globe' ? '🔤' : 
                          session.subject?.icon === 'book' ? '📚' :
                          session.subject?.icon === 'building' ? '🏛️' :
                          session.subject?.icon === 'beaker' ? '🔬' : '📖'}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {session.subject?.name || '과목'} 학습
                        </h3>
                        <p className="text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {new Date(session.created_at).toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-16 text-center border border-purple-200/50">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <MessageSquare className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">아직 대화가 없습니다</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                위의 과목 카드를 클릭해서 AI 튜터와 첫 대화를 시작해보세요!
              </p>
              <button 
                onClick={() => createNewSession(subjects[0]?.id)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                첫 대화 시작하기
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
