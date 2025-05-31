import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MathRenderer from './MathRenderer';

const Chat = ({ subject, session, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const encouragements = [
    "지아야 궁금한 게 있으면 언제든 물어봐! 🌟",
    "어려운 문제도 차근차근 해결해보자! 💪",
    "서울대 가는 길, 함께 걸어가자! ✨",
    "포기하지 말고 계속해봐! 지아는 할 수 있어! 💕"
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
    if (session) {
      fetchMessages();
    }
    scrollToBottom();
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sessions/${session.id}/messages/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('메시지를 불러오는데 실패했어요 😔', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    if (sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    const imageToSend = selectedImage;

    // 메시지 입력 필드 즉시 클리어
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);

    try {
      const formData = new FormData();
      formData.append('content', messageText);
      
      if (subject) {
        formData.append('subject_id', subject.id);
      }
      
      if (session) {
        formData.append('session_id', session.id);
      }
      
      if (imageToSend) {
        formData.append('image', imageToSend);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.user_message, data.ai_response]);
      } else {
        console.error('메시지 전송에 실패했어요 😔');
        // 실패 시 메시지 복구
        setNewMessage(messageText);
        setSelectedImage(imageToSend);
        if (imageToSend) {
          const reader = new FileReader();
          reader.onload = (e) => setImagePreview(e.target.result);
          reader.readAsDataURL(imageToSend);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // 실패 시 메시지 복구
      setNewMessage(messageText);
      setSelectedImage(imageToSend);
      if (imageToSend) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(imageToSend);
      }
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="page-container" style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* 헤더 */}
      <div className="nav" style={{ 
        width: '100%', 
        maxWidth: '1000px',
        flexShrink: 0,
        borderBottom: '2px solid #E6E6FA'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255, 182, 193, 0.2)',
                border: '2px solid #FFB6C1',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 182, 193, 0.4)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 182, 193, 0.2)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              ←
            </button>
            <div>
              <h1 style={{ 
                fontSize: '1.8rem', 
                fontFamily: 'Cute Font, cursive',
                background: 'linear-gradient(135deg, #003876, #4A90E2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                {subjectEmojis[subject?.name] || '📚'} {subject?.name || '학습'} 튜터
              </h1>
              <p style={{ color: '#6B7280', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                지아와 함께하는 서울대 준비! ✨
              </p>
            </div>
          </div>
          
          <div className="encouragement" style={{ 
            fontSize: '0.85rem',
            maxWidth: '200px',
            textAlign: 'right'
          }}>
            {encouragements[Math.floor(Math.random() * encouragements.length)]}
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div style={{
        flex: 1,
        width: '100%',
        maxWidth: '1000px',
        background: 'rgba(255, 255, 255, 0.7)',
        borderRadius: '20px 20px 0 0',
        border: '2px solid #E6E6FA',
        borderBottom: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="loading" style={{ marginBottom: '10px' }}></div>
              <p style={{ color: '#4A90E2' }}>메시지를 불러오는 중이에요... ✨</p>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: 'rgba(255, 182, 193, 0.1)',
              borderRadius: '20px',
              border: '2px dashed #FFB6C1'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🤖💕</div>
              <h3 style={{ 
                fontSize: '1.5rem',
                fontFamily: 'Cute Font, cursive',
                color: '#003876',
                marginBottom: '15px'
              }}>
                안녕 지아! 반가워! 🌟
              </h3>
              <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: '1.6' }}>
                무엇이든 궁금한 게 있으면 물어봐!<br />
                수학 문제든 영어 단어든 모든 걸 도와줄게 ✨<br />
                <span style={{ fontWeight: '600', color: '#4A90E2' }}>
                  서울대 가는 그날까지 함께 하자! 💪
                </span>
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: message.is_ai ? 'flex-start' : 'flex-end',
                marginBottom: '15px'
              }}
            >
              <div style={{
                maxWidth: '70%',
                background: message.is_ai 
                  ? 'linear-gradient(135deg, rgba(255, 182, 193, 0.1), rgba(255, 218, 185, 0.1))'
                  : 'linear-gradient(135deg, #4A90E2, #003876)',
                color: message.is_ai ? '#333' : 'white',
                padding: '15px 20px',
                borderRadius: message.is_ai ? '20px 20px 20px 5px' : '20px 20px 5px 20px',
                border: message.is_ai ? '2px solid #FFB6C1' : 'none',
                position: 'relative'
              }}>
                {message.is_ai && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '15px',
                    background: 'white',
                    border: '2px solid #FFB6C1',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    🤖
                  </div>
                )}

                {!message.is_ai && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '15px',
                    background: 'white',
                    border: '2px solid #4A90E2',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    👩‍🎓
                  </div>
                )}

                <div style={{ marginTop: message.is_ai ? '15px' : '15px' }}>
                  {message.image_path && (
                    <div style={{ marginBottom: '10px' }}>
                      <img 
                        src={message.image_path} 
                        alt="Uploaded" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          borderRadius: '10px',
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }}
                      />
                    </div>
                  )}
                  
                  <MathRenderer content={message.content} />
                  
                  <div style={{
                    fontSize: '0.8rem',
                    opacity: 0.7,
                    marginTop: '8px',
                    textAlign: message.is_ai ? 'left' : 'right'
                  }}>
                    {new Date(message.created_at).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {sending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: 'rgba(255, 182, 193, 0.1)',
                border: '2px solid #FFB6C1',
                borderRadius: '20px 20px 20px 5px',
                padding: '15px 20px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '15px',
                  background: 'white',
                  border: '2px solid #FFB6C1',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  🤖
                </div>
                <div style={{ marginTop: '15px' }}>
                  <div className="loading" style={{ marginBottom: '5px' }}></div>
                  <span style={{ color: '#4A90E2', fontSize: '0.9rem' }}>
                    지아의 질문을 열심히 생각하고 있어요... 💭
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 이미지 미리보기 */}
        {imagePreview && (
          <div style={{
            padding: '15px 20px',
            borderTop: '1px solid #E6E6FA'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '10px',
              borderRadius: '10px',
              border: '2px solid #E6E6FA'
            }}>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
              />
              <span style={{ flex: 1, fontSize: '0.9rem', color: '#4A90E2' }}>
                📷 이미지가 첨부되었어요!
              </span>
              <button
                onClick={removeImage}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid #EF4444',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#EF4444',
                  fontSize: '1rem'
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 입력 영역 */}
        <div style={{
          padding: '20px',
          borderTop: '2px solid #E6E6FA',
          background: 'rgba(255, 255, 255, 0.9)'
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end'
          }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'rgba(255, 182, 193, 0.2)',
                border: '2px solid #FFB6C1',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 182, 193, 0.4)';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 182, 193, 0.2)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              📷
            </button>

            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="지아야, 궁금한 게 있으면 언제든 물어봐! ✨"
              disabled={sending}
              style={{
                flex: 1,
                minHeight: '45px',
                maxHeight: '120px',
                padding: '12px 20px',
                border: '2px solid #E6E6FA',
                borderRadius: '25px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                background: 'rgba(255, 255, 255, 0.9)',
                resize: 'none',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2';
                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E6E6FA';
                e.target.style.boxShadow = 'none';
              }}
            />

            <button
              onClick={handleSendMessage}
              disabled={sending || (!newMessage.trim() && !selectedImage)}
              style={{
                background: (!newMessage.trim() && !selectedImage) 
                  ? 'rgba(200, 200, 200, 0.5)' 
                  : 'linear-gradient(135deg, #4A90E2, #003876)',
                border: 'none',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (!newMessage.trim() && !selectedImage) ? 'not-allowed' : 'pointer',
                fontSize: '1.2rem',
                color: 'white',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (!(!newMessage.trim() && !selectedImage)) {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 5px 15px rgba(74, 144, 226, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {sending ? '⏳' : '🚀'}
            </button>
          </div>
        </div>
      </div>

      {/* 떠다니는 응원 메시지 */}
      <div style={{ 
        position: 'fixed',
        bottom: '100px',
        right: '30px',
        background: 'rgba(176, 224, 230, 0.9)',
        padding: '12px 18px',
        borderRadius: '20px',
        border: '2px solid #B0E0E6',
        maxWidth: '150px',
        fontSize: '0.8rem',
        fontFamily: 'Cute Font, cursive',
        color: '#003876',
        animation: 'float 6s ease-in-out infinite',
        zIndex: 1000
      }}>
        💪 화이팅 지아!
      </div>
    </div>
  );
};

export default Chat;
