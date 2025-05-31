import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const encouragements = [
    "지아야, 오늘도 서울대 향해 파이팅! 💪",
    "아자아자! 넌 할 수 있어! ✨",
    "서울대 입학의 꿈, 함께 이뤄보자! 🌟",
    "열심히 공부하는 지아 응원해! 💕"
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError('로그인에 실패했어요. 아이디와 비밀번호를 확인해주세요! 😔');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* 서울대 로고와 타이틀 */}
      <div className="card fade-in" style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #003876, #4A90E2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            🎓
          </div>
          <h1 className="main-title">지아의 서울대 튜터</h1>
          <p className="subtitle">서울대 가는 그날까지, 함께해요!</p>
        </div>

        {/* 격려 메시지 */}
        <div className="encouragement">
          {encouragements[Math.floor(Math.random() * encouragements.length)]}
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              📚 아이디
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              placeholder="아이디를 입력해주세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              🔐 비밀번호
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="비밀번호를 입력해주세요"
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span style={{ marginRight: '8px' }}>😅</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              marginBottom: '20px',
              fontSize: '1.2rem',
              padding: '18px'
            }}
          >
            {isLoading ? (
              <>
                <span className="loading"></span>
                <span style={{ marginLeft: '10px' }}>로그인 중...</span>
              </>
            ) : (
              '🚀 서울대 향해 출발!'
            )}
          </button>
        </form>

        {/* 회원가입 링크 */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: '#6B7280', marginBottom: '10px' }}>
            아직 계정이 없나요?
          </p>
          <Link 
            to="/register" 
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            ✨ 지아의 학습 여정 시작하기
          </Link>
        </div>

        {/* 서울대 맵 테마 장식 */}
        <div style={{ 
          position: 'absolute',
          bottom: '-20px',
          right: '-20px',
          opacity: 0.1,
          fontSize: '6rem',
          transform: 'rotate(15deg)',
          zIndex: -1
        }}>
          🗺️
        </div>
      </div>

      {/* 추가 격려 메시지들 */}
      <div style={{ 
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'rgba(255, 182, 193, 0.9)',
        padding: '15px 20px',
        borderRadius: '20px',
        border: '2px solid #FFB6C1',
        maxWidth: '200px',
        fontSize: '0.9rem',
        fontFamily: 'Cute Font, cursive',
        color: '#003876',
        animation: 'bounce 3s ease-in-out infinite'
      }}>
        💝 매일매일 성장하는 지아!
      </div>

      <div style={{ 
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(176, 224, 230, 0.9)',
        padding: '15px 20px',
        borderRadius: '20px',
        border: '2px solid #B0E0E6',
        maxWidth: '200px',
        fontSize: '0.9rem',
        fontFamily: 'Cute Font, cursive',
        color: '#003876',
        animation: 'float 4s ease-in-out infinite'
      }}>
        🌟 서울대는 너의 것!
      </div>
    </div>
  );
};

export default Login;
