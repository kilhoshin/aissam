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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat-sessions/${session.id}/messages`, {
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
      
      if (imageToSend) {
        formData.append('image', imageToSend);
      }

      // Determine endpoint URL
      let endpoint;
      if (session) {
        endpoint = `${import.meta.env.VITE_API_BASE_URL}/chat-sessions/${session.id}/messages`;
      } else if (subject) {
        // Create new session first
        const sessionResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat-sessions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject_id: subject.id,
            title: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '')
          })
        });

        if (!sessionResponse.ok) {
          throw new Error('세션 생성에 실패했어요');
        }

        const newSession = await sessionResponse.json();
        endpoint = `${import.meta.env.VITE_API_BASE_URL}/chat-sessions/${newSession.id}/messages`;
      } else {
        throw new Error('과목 또는 세션 정보가 필요해요');
      }

      const response = await fetch(endpoint, {
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
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px',
      fontFamily: 'Cute Font, Arial, sans-serif'
    }}>
      {/* 헤더 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '20px',
        padding: '15px 20px',
        marginBottom: '15px',
        border: '2px solid rgba(199, 125, 255, 0.3)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 25px rgba(255, 154, 158, 0.2)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: '1', minWidth: '200px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '15px',
                padding: '8px 12px',
                cursor: 'pointer',
                color: '#8B5A83',
                fontWeight: '600',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 5px 15px rgba(255, 154, 158, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              ← 뒤로가기
            </button>
            
            <div>
              <h2 style={{ 
                margin: 0, 
                color: '#8B5A83',
                fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                fontFamily: 'Cute Font, cursive',
                fontWeight: '600'
              }}>
                {subjectEmojis[subject?.name] || '📚'} {subject?.name || '공부하기'}
              </h2>
              <p style={{ 
                margin: '2px 0 0 0', 
                color: '#C77DFF',
                fontSize: 'clamp(0.75rem, 2vw, 0.9rem)'
              }}>
                AI 선생님과 함께 공부해요! 💕
              </p>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(199, 125, 255, 0.1)',
            padding: '8px 15px',
            borderRadius: '15px',
            border: '2px solid rgba(199, 125, 255, 0.3)',
            fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
            color: '#8B5A83',
            textAlign: 'center'
          }}>
            💬 {messages.length}개 메시지
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div style={{
        flex: 1,
        background: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '20px',
        border: '2px solid rgba(199, 125, 255, 0.3)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 25px rgba(255, 154, 158, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginBottom: '15px'
      }}>
        {/* 메시지 영역 */}
        <div 
          ref={messagesEndRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            minHeight: '0'
          }}
        >
          {loading && messages.length === 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(199, 125, 255, 0.3)',
                borderTop: '4px solid #C77DFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ 
                color: '#8B5A83',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                textAlign: 'center'
              }}>
                메시지를 불러오고 있어요... 🌸
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'rgba(255, 182, 193, 0.1)',
              borderRadius: '20px',
              border: '2px dashed rgba(199, 125, 255, 0.3)',
              margin: '20px 0'
            }}>
              <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', marginBottom: '20px' }}>🌸</div>
              <h3 style={{ 
                color: '#8B5A83',
                marginBottom: '15px',
                fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                fontFamily: 'Cute Font, cursive'
              }}>
                첫 대화를 시작해보세요!
              </h3>
              <p style={{ 
                color: '#C77DFF',
                lineHeight: '1.6',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
              }}>
                궁금한 것을 물어보면 AI 선생님이<br />
                친절하게 설명해드릴게요! ✨
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: !message.is_user ? 'flex-start' : 'flex-end',
                  marginBottom: '20px'
                }}
              >
                <div style={{
                  maxWidth: 'min(85%, 500px)',
                  background: !message.is_user 
                    ? 'linear-gradient(135deg, rgba(255, 182, 193, 0.15), rgba(255, 218, 185, 0.15))'
                    : 'linear-gradient(135deg, #C77DFF, #E0AAFF)',
                  color: !message.is_user ? '#8B5A83' : 'white',
                  padding: '18px 22px',
                  borderRadius: !message.is_user ? '25px 25px 25px 8px' : '25px 25px 8px 25px',
                  border: !message.is_user ? '2px solid rgba(255, 182, 193, 0.4)' : 'none',
                  position: 'relative',
                  boxShadow: !message.is_user 
                    ? '0 5px 15px rgba(255, 182, 193, 0.2)' 
                    : '0 5px 15px rgba(199, 125, 255, 0.3)'
                }}>
                  {!message.is_user && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '20px',
                      background: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
                      border: '3px solid white',
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                      boxShadow: '0 3px 10px rgba(255, 154, 158, 0.3)'
                    }}>
                      🤖
                    </div>
                  )}

                  {message.is_user && (
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '20px',
                      background: 'linear-gradient(135deg, #E0AAFF, #C77DFF)',
                      border: '3px solid white',
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                      boxShadow: '0 3px 10px rgba(199, 125, 255, 0.3)'
                    }}>
                      👩‍🎓
                    </div>
                  )}

                  <div style={{ marginTop: '18px' }}>
                    {message.image_path && (
                      <div style={{ marginBottom: '15px' }}>
                        <img 
                          src={message.image_path} 
                          alt="업로드된 이미지" 
                          style={{
                            maxWidth: '100%',
                            maxHeight: '250px',
                            borderRadius: '15px',
                            border: '3px solid rgba(255, 255, 255, 0.5)',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    )}
                    
                    <MathRenderer content={message.content} />
                    
                    <div style={{
                      fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
                      opacity: 0.8,
                      marginTop: '12px',
                      textAlign: !message.is_user ? 'left' : 'right'
                    }}>
                      {new Date(message.created_at).toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {sending && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.15), rgba(255, 218, 185, 0.15))',
                border: '2px solid rgba(255, 182, 193, 0.4)',
                borderRadius: '25px 25px 25px 8px',
                padding: '18px 22px',
                position: 'relative',
                maxWidth: 'min(85%, 500px)'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '20px',
                  background: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
                  border: '3px solid white',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  🤖
                </div>
                
                <div style={{ marginTop: '18px' }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#C77DFF',
                      animation: 'bounce 1.4s ease-in-out infinite both'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#C77DFF',
                      animation: 'bounce 1.4s ease-in-out 0.2s infinite both'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#C77DFF',
                      animation: 'bounce 1.4s ease-in-out 0.4s infinite both'
                    }}></div>
                    <span style={{ 
                      marginLeft: '10px',
                      color: '#8B5A83',
                      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)'
                    }}>
                      답변을 생각하고 있어요...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div style={{
          padding: '20px',
          borderTop: '2px solid rgba(199, 125, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {/* 이미지 업로드 영역 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '15px',
                  padding: '12px 18px',
                  cursor: 'pointer',
                  color: '#8B5A83',
                  fontWeight: '600',
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 5px 15px rgba(255, 154, 158, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                📷 이미지 추가
              </button>
              
              {selectedImage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(199, 125, 255, 0.1)',
                  padding: '8px 15px',
                  borderRadius: '15px',
                  border: '2px solid rgba(199, 125, 255, 0.3)'
                }}>
                  <span style={{ 
                    color: '#8B5A83',
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)'
                  }}>
                    📷 {selectedImage.name}
                  </span>
                  <button
                    onClick={() => setSelectedImage(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FF6B6B',
                      cursor: 'pointer',
                      fontSize: '1.2rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* 메시지 입력 및 전송 */}
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end'
            }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="궁금한 것을 물어보세요! (Shift+Enter로 줄바꿈)"
                style={{
                  flex: 1,
                  minHeight: '60px',
                  maxHeight: '120px',
                  padding: '15px 20px',
                  border: '2px solid rgba(199, 125, 255, 0.3)',
                  borderRadius: '20px',
                  outline: 'none',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                  fontFamily: 'inherit',
                  color: '#8B5A83',
                  background: 'rgba(255, 255, 255, 0.9)',
                  resize: 'none',
                  lineHeight: '1.4',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C77DFF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(199, 125, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(199, 125, 255, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={sending || (!newMessage.trim() && !selectedImage)}
                style={{
                  background: sending || (!newMessage.trim() && !selectedImage)
                    ? 'rgba(199, 125, 255, 0.3)'
                    : 'linear-gradient(135deg, #C77DFF, #E0AAFF)',
                  border: 'none',
                  borderRadius: '18px',
                  padding: '15px 20px',
                  cursor: sending || (!newMessage.trim() && !selectedImage) ? 'not-allowed' : 'pointer',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                  transition: 'all 0.3s ease',
                  minWidth: '70px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: sending || (!newMessage.trim() && !selectedImage)
                    ? 'none'
                    : '0 5px 15px rgba(199, 125, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!sending && (newMessage.trim() || selectedImage)) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 8px 25px rgba(199, 125, 255, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = sending || (!newMessage.trim() && !selectedImage)
                    ? 'none'
                    : '0 5px 15px rgba(199, 125, 255, 0.3)';
                }}
              >
                {sending ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
