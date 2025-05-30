# 🚀 AISSAM 배포 가이드 (Railway + Vercel + Supabase)

## 📋 **준비사항**
- GitHub 계정
- Google 계정 (Vercel 로그인용)
- 코드를 GitHub에 푸시

## 1️⃣ **Supabase 설정 (데이터베이스)**

### 1. Supabase 계정 생성
1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub로 로그인

### 2. 새 프로젝트 생성
1. "New project" 클릭
2. 프로젝트 이름: `aissam-db`
3. Database Password: 강력한 비밀번호 설정
4. Region: Northeast Asia (ap-northeast-1) 선택
5. "Create new project" 클릭

### 3. 데이터베이스 정보 확인
1. 좌측 메뉴 "Settings" → "Database" 클릭
2. "Connection string" 탭에서 "URI" 복사
3. `postgres://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres` 형태

### 4. 테이블 생성
1. 좌측 메뉴 "SQL Editor" 클릭
2. 다음 SQL 실행:

```sql
-- Users 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    grade VARCHAR NOT NULL,
    hashed_password VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects 테이블  
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    icon VARCHAR NOT NULL
);

-- 기본 과목 데이터 삽입
INSERT INTO subjects (name, color, icon) VALUES
('수학', 'blue', 'calculator'),
('국어', 'green', 'globe'),
('영어', 'purple', 'book'),
('사회탐구', 'orange', 'building'),
('과학탐구', 'red', 'beaker');

-- Chat Sessions 테이블
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    subject_id INTEGER REFERENCES subjects(id),
    title VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages 테이블
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id),
    content TEXT NOT NULL,
    is_user BOOLEAN NOT NULL,
    image_url VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 2️⃣ **Railway 설정 (백엔드)**

### 1. Railway 계정 생성
1. [railway.app](https://railway.app) 접속  
2. "Login" → GitHub로 로그인

### 2. 새 프로젝트 생성
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. AISSAM 저장소 선택
4. "Deploy Now" 클릭

### 3. 환경변수 설정
1. 프로젝트 대시보드에서 "Variables" 탭 클릭
2. 다음 환경변수 추가:

```
DATABASE_URL=여기에_Supabase_URI_붙여넣기
SECRET_KEY=여기에_JWT_시크릿키_입력
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=여기에_Google_Gemini_API_키_입력
```

### 4. 도메인 확인
- 배포 완료 후 `xxx.railway.app` 도메인 확인
- 이 URL을 메모해두세요 (프론트엔드에서 사용)

## 3️⃣ **Vercel 설정 (프론트엔드)**

### 1. Vercel 계정 생성
1. [vercel.com](https://vercel.com) 접속
2. "Sign Up" → GitHub로 로그인

### 2. 새 프로젝트 생성
1. "New Project" 클릭
2. AISSAM 저장소 선택
3. "Import" 클릭

### 3. 빌드 설정
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 4. 환경변수 설정
1. "Environment Variables" 섹션에서 추가:

```
VITE_API_URL=https://여기에_Railway_도메인_입력.railway.app
```

### 5. 배포
1. "Deploy" 클릭
2. 배포 완료까지 대기

## 4️⃣ **CORS 설정 업데이트**

백엔드의 main.py에서 CORS 설정을 Vercel 도메인으로 업데이트:

```python
# Railway에서 환경변수로 설정
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Railway에 `FRONTEND_URL=https://여기에_Vercel_도메인` 환경변수 추가

## 5️⃣ **테스트**

1. Vercel 도메인으로 접속
2. 회원가입/로그인 테스트
3. 채팅 기능 테스트
4. 이미지 업로드 테스트

## 🔧 **문제 해결**

### 데이터베이스 연결 실패
- Supabase URI가 정확한지 확인
- `postgres://`를 `postgresql://`로 변경했는지 확인

### CORS 에러
- Railway의 FRONTEND_URL 환경변수 확인
- Vercel 도메인이 정확한지 확인

### 빌드 실패
- `psycopg2-binary` 패키지가 requirements.txt에 있는지 확인
- Python 버전이 3.11인지 확인

## 💰 **비용**
- **Supabase**: 무료 (500MB 데이터베이스)
- **Railway**: $5/월 크레딧 (무료 사용량 포함)
- **Vercel**: 무료 (개인 프로젝트)

**총 예상 비용**: 월 $0-5 🎉
