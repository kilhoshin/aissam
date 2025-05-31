import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const encouragements = [
    "지아야, 서울대 가는 여정이 시작돼! ",
    "새로운 도전, 새로운 시작! 화이팅! ",
    "꿈을 향한 첫걸음을 응원해! ",
    "지아의 성공 스토리가 시작돼요! "
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

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않아요! 다시 확인해주세요 ');
      setIsLoading(false);
      return;
    }

    if (!formData.grade) {
      setError('학년을 선택해주세요! ');
      setIsLoading(false);
      return;
    }

    try {
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        grade: formData.grade
      };
      
      await register(registrationData);
      navigate('/dashboard');
    } catch (err) {
      setError('회원가입에 실패했어요. 다시 시도해주세요! ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* 메인 카드 */}
      <div className="card fade-in" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #003876, #4A90E2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            
          </div>
          <h1 className="main-title">지아야 서울대 가자!</h1>
          <p className="subtitle">꿈을 현실로 만드는 여정의 시작</p>
        </div>

        {/* 격려 메시지 */}
        <div className="encouragement">
          {encouragements[Math.floor(Math.random() * encouragements.length)]}
        </div>

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              사용자명 (지아처럼 귀여운 이름으로!)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="지아, 서울대생지아, 등등..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              이메일 주소
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="zia@seoul-university.future"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="grade" className="form-label">
              학년 선택
            </label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">학년을 선택해주세요</option>
              <option value="고1">고등학교 1학년</option>
              <option value="고2">고등학교 2학년</option>
              <option value="고3">고등학교 3학년</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              비밀번호 (서울대처럼 강력하게!)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="8글자 이상으로 안전하게"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="위와 동일하게 입력해주세요"
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span style={{ marginRight: '8px' }}> </span>
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
                <span style={{ marginLeft: '10px' }}>가입 중...</span>
              </>
            ) : (
              ' 지아의 서울대 여정 시작!'
            )}
          </button>
        </form>

        {/* 로그인 링크 */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: '#6B7280', marginBottom: '10px' }}>
            이미 계정이 있나요?
          </p>
          <Link 
            to="/login" 
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            로그인하러 가기
          </Link>
        </div>

        {/* 서울대 맵 장식 */}
        <div style={{ 
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          opacity: 0.1,
          fontSize: '8rem',
          transform: 'rotate(-15deg)',
          zIndex: -1
        }}>
          
        </div>
      </div>

      {/* 서울대 정보 카드 */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '20px',
        borderRadius: '20px',
        border: '2px solid rgba(0, 56, 118, 0.3)',
        maxWidth: '280px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ 
          color: '#003876', 
          marginBottom: '15px',
          fontFamily: 'Cute Font, cursive',
          fontSize: '1.3rem'
        }}>
           서울대 목표 체크!
        </h3>
        <div style={{ fontSize: '0.9rem', color: '#4A90E2', lineHeight: '1.6' }}>
           매일 성실한 학습<br/>
           포기하지 않는 의지<br/>
           꾸준한 성장<br/>
           서울대 입학!
        </div>
      </div>

      {/* 떠다니는 격려 메시지들 */}
      <div style={{ 
        position: 'fixed',
        top: '15%',
        left: '10%',
        background: 'rgba(255, 182, 193, 0.8)',
        padding: '12px 18px',
        borderRadius: '25px',
        border: '2px solid #FFB6C1',
        fontSize: '0.85rem',
        fontFamily: 'Cute Font, cursive',
        color: '#003876',
        animation: 'float 6s ease-in-out infinite',
        transform: 'rotate(-5deg)'
      }}>
        할 수 있어! 아자아자! 
      </div>

      <div style={{ 
        position: 'fixed',
        top: '60%',
        right: '8%',
        background: 'rgba(176, 224, 230, 0.8)',
        padding: '12px 18px',
        borderRadius: '25px',
        border: '2px solid #B0E0E6',
        fontSize: '0.85rem',
        fontFamily: 'Cute Font, cursive',
        color: '#003876',
        animation: 'bounce 4s ease-in-out infinite',
        transform: 'rotate(3deg)'
      }}>
        지아는 최고야! 
      </div>

      <div style={{ 
        position: 'fixed',
        top: '25%',
        right: '15%',
        background: 'rgba(255, 218, 185, 0.8)',
        padding: '12px 18px',
        borderRadius: '25px',
        border: '2px solid #FFDAB9',
        fontSize: '0.85rem',
        fontFamily: 'Cute Font, cursive',
        color: '#003876',
        animation: 'float 5s ease-in-out infinite reverse',
        transform: 'rotate(8deg)'
      }}>
        서울대 갈 거야! 
      </div>
    </div>
  );
};

export default Register;
