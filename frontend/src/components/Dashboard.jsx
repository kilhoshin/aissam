import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Chat from './Chat';

const Dashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const encouragements = [
    "지아야, 오늘도 열심히 공부해보자! 💪",
    "서울대까지 한 걸음씩! 화이팅! ✨",
    "꾸준히 하면 반드시 될 거야! 🌟",
    "지아는 정말 대단해! 포기하지 마! 💕"
  ];

  const subjectEmojis = {
    '수학': '🔢',
    '영어': '🇺🇸',
    '국어': '📖',
    '과학': '🧪',
    '사회': '🌍',
    '물리': '⚛️',
    '화학': '🧬',
    '생물': '🌱',
    '지구과학': '🌎',
    '한국사': '📜',
    '세계사': '🏺',
    '지리': '🗺️'
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/subjects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      } else {
        setError('과목을 불러오는데 실패했어요 😔');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했어요 😅');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (subjectId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat-sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter sessions by subject_id
        const filteredSessions = data.filter(session => session.subject_id === subjectId);
        setSessions(filteredSessions);
      }
    } catch (err) {
      setError('세션을 불러오는데 실패했어요 😔');
    }
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setSelectedSession(null);
    setShowChat(false);
    fetchSessions(subject.id);
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setShowChat(true);
  };

  const handleNewSession = () => {
    setSelectedSession(null);
    setShowChat(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="page-container" style={{ justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="loading" style={{ marginBottom: '20px' }}></div>
          <p style={{ fontSize: '1.2rem', color: '#4A90E2' }}>
            지아의 학습 환경을 준비중이에요... ✨
          </p>
        </div>
      </div>
    );
  }

  if (showChat) {
    return (
      <Chat 
        subject={selectedSubject}
        session={selectedSession}
        onBack={() => setShowChat(false)}
      />
    );
  }

  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="nav" style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontFamily: 'Cute Font, cursive',
              background: 'linear-gradient(135deg, #003876, #4A90E2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              🎓 지아의 서울대 튜터
            </h1>
            <p style={{ color: '#6B7280', margin: '5px 0 0 0' }}>
              안녕하세요, {user?.name || '지아'}님! 오늘도 화이팅! 💪
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ fontSize: '0.9rem', padding: '10px 20px' }}
          >
            👋 안녕히 가세요
          </button>
        </div>
      </div>

      {/* 메인 타이틀 */}
      <div className="card fade-in" style={{ width: '100%', maxWidth: '1200px', textAlign: 'center' }}>
        <h2 className="main-title" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
          지아야 서울대 가자! 🌟
        </h2>
        <p className="subtitle" style={{ marginBottom: '20px' }}>
          꿈을 향한 여정, 함께 걸어가요
        </p>
        
        {/* 격려 메시지 */}
        <div className="encouragement">
          {encouragements[Math.floor(Math.random() * encouragements.length)]}
        </div>

        {/* 진행률 표시 */}
        <div style={{ margin: '30px 0' }}>
          <h3 style={{ 
            color: '#003876', 
            marginBottom: '15px',
            fontFamily: 'Cute Font, cursive',
            fontSize: '1.3rem'
          }}>
            📊 지아의 학습 진행률
          </h3>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${Math.min((subjects.length * 10), 100)}%` }}
            ></div>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#4A90E2', marginTop: '10px' }}>
            {subjects.length > 0 ? `${subjects.length}개 과목으로 열심히 공부 중! 🔥` : '첫 과목을 선택해보세요! ✨'}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ maxWidth: '1200px', width: '100%' }}>
          <span style={{ marginRight: '8px' }}>😅</span>
          {error}
        </div>
      )}

      {/* 과목 선택 섹션 */}
      <div className="card fade-in" style={{ width: '100%', maxWidth: '1200px' }}>
        <h3 style={{ 
          fontSize: '1.8rem',
          fontFamily: 'Cute Font, cursive',
          color: '#003876',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          📚 어떤 과목을 공부할까요?
        </h3>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {subjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => handleSubjectSelect(subject)}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: selectedSubject?.id === subject.id ? '3px solid #4A90E2' : '2px solid #E6E6FA',
                borderRadius: '20px',
                padding: '25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="card"
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.boxShadow = '0 15px 30px rgba(74, 144, 226, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
                {subjectEmojis[subject.name] || '📖'}
              </div>
              <h4 style={{ 
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#003876',
                marginBottom: '10px'
              }}>
                {subject.name}
              </h4>
              <p style={{ 
                color: '#6B7280',
                fontSize: '0.9rem',
                lineHeight: '1.4'
              }}>
                {subject.description || '열심히 공부해서 서울대 가자!'}
              </p>
              
              {selectedSubject?.id === subject.id && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#4A90E2',
                  color: 'white',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 세션 섹션 */}
      {selectedSubject && (
        <div className="card fade-in" style={{ width: '100%', maxWidth: '1200px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '25px',
            flexWrap: 'wrap'
          }}>
            <h3 style={{ 
              fontSize: '1.6rem',
              fontFamily: 'Cute Font, cursive',
              color: '#003876',
              margin: 0
            }}>
              💭 {selectedSubject.name} 학습 세션
            </h3>
            <button
              onClick={handleNewSession}
              className="btn btn-primary"
              style={{ fontSize: '0.9rem', padding: '12px 24px' }}
            >
              ✨ 새로운 공부 시작!
            </button>
          </div>

          {sessions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              background: 'rgba(255, 182, 193, 0.1)',
              borderRadius: '15px',
              border: '2px dashed #FFB6C1'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📝</div>
              <p style={{ 
                fontSize: '1.1rem',
                color: '#4A90E2',
                fontFamily: 'Cute Font, cursive'
              }}>
                첫 번째 {selectedSubject.name} 공부를 시작해보세요!
              </p>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', marginTop: '10px' }}>
                궁금한 것들을 AI 선생님과 함께 해결해봐요 ✨
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '15px'
            }}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionSelect(session)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '2px solid #E6E6FA',
                    borderRadius: '15px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#4A90E2';
                    e.target.style.transform = 'translateX(5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#E6E6FA';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  <div>
                    <h4 style={{ 
                      color: '#003876',
                      marginBottom: '5px',
                      fontSize: '1.1rem'
                    }}>
                      💬 {session.title || `${selectedSubject.name} 공부`}
                    </h4>
                    <p style={{ 
                      color: '#6B7280',
                      fontSize: '0.9rem',
                      margin: 0
                    }}>
                      {new Date(session.created_at).toLocaleDateString('ko-KR')} 📅
                    </p>
                  </div>
                  <div style={{ fontSize: '1.5rem' }}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 떠다니는 응원 메시지들 */}
      <div style={{ 
        position: 'fixed',
        bottom: '30px',
        left: '30px',
        background: 'rgba(255, 182, 193, 0.9)',
        padding: '15px 20px',
        borderRadius: '25px',
        border: '2px solid #FFB6C1',
        maxWidth: '200px',
        fontSize: '0.85rem',
        fontFamily: 'Cute Font, cursive',
        color: '#003876',
        animation: 'bounce 4s ease-in-out infinite',
        zIndex: 1000
      }}>
        🎯 목표: 서울대 입학!
      </div>

      <div style={{ 
        position: 'fixed',
        top: '50%',
        right: '30px',
        background: 'rgba(176, 224, 230, 0.9)',
        padding: '15px 20px',
        borderRadius: '25px',
        border: '2px solid #B0E0E6',
        maxWidth: '180px',
        fontSize: '0.85rem',
        fontFamily: 'Cute Font, cursive',
        color: '#003876',
        animation: 'float 5s ease-in-out infinite',
        zIndex: 1000
      }}>
        ✨ 지아는 할 수 있어!
      </div>
    </div>
  );
};

export default Dashboard;
