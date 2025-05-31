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
    <div className="page-container" style={{
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      minHeight: '100vh',
      padding: '10px'
    }}>
      {/* 헤더 */}
      <div className="nav" style={{ 
        width: '100%', 
        maxWidth: '100%',
        padding: '0 10px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <h1 style={{ 
              fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
              fontFamily: 'Cute Font, cursive',
              background: 'linear-gradient(135deg, #8B5A83, #C77DFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              🎓 지아의 서울대 튜터
            </h1>
            <p style={{ 
              color: '#8B5A83', 
              margin: '5px 0 0 0',
              fontSize: 'clamp(0.8rem, 2.5vw, 1rem)'
            }}>
              안녕하세요, {user?.name || '지아'}님! 오늘도 화이팅! 💪
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <div className="encouragement" style={{ 
              fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
              maxWidth: '180px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.7)',
              padding: '8px 12px',
              borderRadius: '15px',
              border: '2px solid rgba(199, 125, 255, 0.3)',
              color: '#8B5A83'
            }}>
              {encouragements[Math.floor(Math.random() * encouragements.length)]}
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                padding: '8px 16px',
                color: '#8B5A83',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 8px 25px rgba(255, 154, 158, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '25px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* 과목 선택 섹션 */}
        <div style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '25px',
          padding: '25px',
          border: '3px solid rgba(199, 125, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 15px 35px rgba(255, 154, 158, 0.2)'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
            fontFamily: 'Cute Font, cursive',
            color: '#8B5A83',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            📚 어떤 과목을 공부할까요?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleSubjectSelect(subject)}
                style={{
                  background: selectedSubject?.id === subject.id 
                    ? 'linear-gradient(135deg, #ff9a9e, #fad0c4)'
                    : 'rgba(255, 255, 255, 0.9)',
                  border: selectedSubject?.id === subject.id 
                    ? '3px solid #C77DFF' 
                    : '2px solid rgba(199, 125, 255, 0.3)',
                  borderRadius: '20px',
                  padding: '20px 15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (selectedSubject?.id !== subject.id) {
                    e.target.style.transform = 'translateY(-5px)';
                    e.target.style.boxShadow = '0 10px 25px rgba(255, 154, 158, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSubject?.id !== subject.id) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                <span style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                  {subjectEmojis[subject.name] || '📖'}
                </span>
                <span style={{ 
                  fontWeight: '600', 
                  color: '#8B5A83',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                }}>
                  {subject.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 세션 목록 */}
        {selectedSubject && (
          <div style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '25px',
            padding: '25px',
            border: '3px solid rgba(199, 125, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 15px 35px rgba(255, 154, 158, 0.2)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <h3 style={{ 
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                fontFamily: 'Cute Font, cursive',
                color: '#8B5A83',
                margin: 0
              }}>
                {subjectEmojis[selectedSubject.name]} {selectedSubject.name} 대화 기록
              </h3>
              
              <button
                onClick={handleNewSession}
                style={{
                  background: 'linear-gradient(135deg, #C77DFF, #E0AAFF)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '12px 20px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 5px 15px rgba(199, 125, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 8px 25px rgba(199, 125, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 5px 15px rgba(199, 125, 255, 0.3)';
                }}
              >
                ✨ 새로 시작하기
              </button>
            </div>

            {sessions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(255, 182, 193, 0.1)',
                borderRadius: '20px',
                border: '2px dashed rgba(199, 125, 255, 0.3)'
              }}>
                <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '15px' }}>🌸</div>
                <p style={{ 
                  color: '#8B5A83', 
                  fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                  lineHeight: '1.6'
                }}>
                  아직 {selectedSubject.name} 대화가 없어요!<br />
                  <span style={{ fontWeight: '600' }}>새로 시작하기</span>를 눌러 첫 질문을 해보세요! 💕
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '15px'
              }}>
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '2px solid rgba(199, 125, 255, 0.3)',
                      borderRadius: '20px',
                      padding: '20px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-3px)';
                      e.target.style.boxShadow = '0 10px 25px rgba(255, 154, 158, 0.3)';
                      e.target.style.borderColor = '#C77DFF';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.borderColor = 'rgba(199, 125, 255, 0.3)';
                    }}
                  >
                    <h4 style={{ 
                      margin: '0 0 10px 0', 
                      color: '#8B5A83',
                      fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                      fontWeight: '600'
                    }}>
                      {session.title}
                    </h4>
                    <div style={{ 
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', 
                      color: '#999',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '5px'
                    }}>
                      <span>💬 {session.message_count}개 메시지</span>
                      <span>{new Date(session.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #FF6B6B',
            borderRadius: '20px',
            padding: '20px',
            color: '#FF6B6B',
            textAlign: 'center',
            width: '100%',
            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
