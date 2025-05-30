from fastapi import FastAPI, HTTPException, Depends, Form, File, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
from pathlib import Path
from typing import List, Optional
from jose import jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt
import asyncio
from PIL import Image
import io

from database import get_db, engine
from models import Base, User, Subject, ChatSession, Message, UploadedImage
from schemas import (
    UserCreate, UserResponse, LoginRequest, Token, SubjectResponse, 
    ChatSessionCreate, ChatSessionResponse, MessageResponse
)
from ai_service import AIService

# Load environment variables
load_dotenv()

# JWT 설정
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    # bytes인 경우 문자열로 변환
    if isinstance(encoded_jwt, bytes):
        encoded_jwt = encoded_jwt.decode('utf-8')
    return encoded_jwt

# 데이터베이스 마이그레이션 실행
def run_migrations():
    """애플리케이션 시작 시 필요한 마이그레이션 실행"""
    try:
        from sqlalchemy import text
        with SessionLocal() as db:
            # messages 테이블에 image_path 컬럼 존재 여부 확인 후 추가
            try:
                # 컬럼 존재 여부 확인
                result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'messages' AND column_name = 'image_path'
                """))
                column_exists = result.fetchone() is not None
                
                if not column_exists:
                    db.execute(text("ALTER TABLE messages ADD COLUMN image_path VARCHAR NULL"))
                    db.commit()
                    print("✅ Database migration: image_path column added")
                else:
                    print("⚠️ image_path column already exists")
            except Exception as e:
                db.rollback()
                print(f"⚠️ Migration warning: {e}")
            
            # uploaded_images 테이블 존재 여부 확인 후 생성
            try:
                result = db.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_name = 'uploaded_images'
                """))
                table_exists = result.fetchone() is not None
                
                if not table_exists:
                    db.execute(text("""
                        CREATE TABLE uploaded_images (
                            id SERIAL PRIMARY KEY,
                            session_id INTEGER NOT NULL,
                            filename VARCHAR NOT NULL,
                            filepath VARCHAR NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    db.commit()
                    print("✅ Database migration: uploaded_images table created")
                else:
                    print("⚠️ uploaded_images table already exists")
            except Exception as e:
                db.rollback()
                print(f"⚠️ uploaded_images table creation warning: {e}")
                
            # 기본 subjects 데이터 확인/추가
            try:
                result = db.execute(text("SELECT COUNT(*) FROM subjects"))
                count = result.scalar()
                
                if count == 0:
                    db.execute(text("""
                        INSERT INTO subjects (name, color, icon) VALUES
                        ('수학', '#3B82F6', 'calculator'),
                        ('영어', '#EF4444', 'globe'),
                        ('국어', '#10B981', 'book'),
                        ('사회탐구', '#F97316', 'building'),
                        ('과학탐구', '#8B5CF6', 'beaker')
                    """))
                    db.commit()
                    print("✅ Default subjects data inserted")
            except Exception as e:
                db.rollback()
                print(f"⚠️ Subjects insertion warning: {e}")
                
    except Exception as e:
        print(f"❌ Migration failed: {e}")

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# 마이그레이션 실행
run_migrations()

# FastAPI 앱 생성
app = FastAPI(title="AISSAM API", version="1.0.0")

# AI 서비스 초기화
ai_service = AIService()

# CORS 설정
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# CORS 설정 - 프로덕션 환경에서 확실히 작동하도록 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aissam-sigma.vercel.app",  # 프로덕션 프론트엔드
        "http://localhost:3000",           # 로컬 개발
        "http://localhost:5173",           # Vite 개발 서버
        "http://127.0.0.1:3000",           # 로컬 개발 (대체)
        "http://127.0.0.1:5173"            # Vite 개발 서버 (대체)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Initialize services

oauth2_scheme = HTTPBearer()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.get("/")
async def root():
    return {"message": "AISSAM API is running"}

@app.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # 받은 데이터 로깅
        print(f"Registration attempt: email={user.email}, name='{user.name}', grade='{user.grade}'")
        
        # Validation 확인
        if not user.name or not user.name.strip():
            print("Error: Name is empty or whitespace")
            raise HTTPException(status_code=400, detail="이름을 입력해주세요.")
        
        if not user.email or not user.email.strip():
            print("Error: Email is empty or whitespace")
            raise HTTPException(status_code=400, detail="이메일을 입력해주세요.")
            
        if not user.password or len(user.password) < 6:
            print("Error: Password too short")
            raise HTTPException(status_code=400, detail="비밀번호는 최소 6자 이상이어야 합니다.")
            
        if not user.grade or user.grade not in ['고1', '고2', '고3']:
            print(f"Error: Invalid grade '{user.grade}'")
            raise HTTPException(status_code=400, detail="올바른 학년을 선택해주세요.")
        
        # Check if user already exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            print(f"Error: Email {user.email} already exists")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            name=user.name,
            hashed_password=hashed_password,
            grade=user.grade
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        print(f"User successfully created: {user.email}")
        return UserResponse(
            id=db_user.id,
            email=db_user.email,
            name=db_user.name,
            grade=db_user.grade
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the error and return a generic message
        print(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.")

@app.post("/token", response_model=Token)
async def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(hours=24)  # 30분에서 24시간으로 변경
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """현재 인증된 사용자 반환"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user_id = int(user_id_str)
    except (jwt.JWTError, jwt.ExpiredSignatureError, jwt.JWTClaimsError):
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        grade=current_user.grade
    )

@app.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    if not subjects:
        # Initialize default subjects
        default_subjects = [
            Subject(name="수학", color="#3B82F6", icon="calculator"),
            Subject(name="영어", color="#EF4444", icon="globe"),
            Subject(name="국어", color="#10B981", icon="book"),
            Subject(name="사회탐구", color="#F97316", icon="building"),
            Subject(name="과학탐구", color="#8B5CF6", icon="beaker")
        ]
        for subject in default_subjects:
            db.add(subject)
        db.commit()
        subjects = default_subjects
    
    return [SubjectResponse(
        id=subject.id,
        name=subject.name,
        color=subject.color,
        icon=subject.icon
    ) for subject in subjects]

@app.post("/chat-sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_session = ChatSession(
        user_id=current_user.id,
        subject_id=session_data.subject_id,
        title=session_data.title or f"{datetime.now().strftime('%Y-%m-%d %H:%M')} 질문"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    # Get subject info for response
    subject = db.query(Subject).filter(Subject.id == db_session.subject_id).first()
    
    return ChatSessionResponse(
        id=db_session.id,
        user_id=db_session.user_id,
        subject_id=db_session.subject_id,
        title=db_session.title,
        created_at=db_session.created_at,
        subject=SubjectResponse(
            id=subject.id,
            name=subject.name,
            color=subject.color,
            icon=subject.icon
        ),
        message_count=0  # New session starts with 0 messages
    )

@app.get("/chat-sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get sessions with message count and subject info, only sessions that have messages
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).join(Subject).all()
    
    # Filter sessions that have at least one message and include message count
    session_responses = []
    for session in sessions:
        message_count = db.query(Message).filter(Message.session_id == session.id).count()
        if message_count > 0:  # Only include sessions with messages
            session_responses.append(ChatSessionResponse(
                id=session.id,
                user_id=session.user_id,
                subject_id=session.subject_id,
                title=session.title,
                created_at=session.created_at,
                subject=SubjectResponse(
                    id=session.subject.id,
                    name=session.subject.name,
                    color=session.subject.color,
                    icon=session.subject.icon
                ),
                message_count=message_count
            ))
    
    # Sort by creation date, most recent first
    session_responses.sort(key=lambda x: x.created_at, reverse=True)
    return session_responses

@app.get("/chat-sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).join(Subject).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Get message count for this session
    message_count = db.query(Message).filter(Message.session_id == session.id).count()
    
    return ChatSessionResponse(
        id=session.id,
        user_id=session.user_id,
        subject_id=session.subject_id,
        title=session.title,
        created_at=session.created_at,
        subject=SubjectResponse(
            id=session.subject.id,
            name=session.subject.name,
            color=session.subject.color,
            icon=session.subject.icon
        ),
        message_count=message_count
    )

@app.post("/chat-sessions/{session_id}/messages")
async def send_message_with_image(
    session_id: int,
    content: str = Form(...),
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """이미지와 함께 메시지 전송"""
    import os
    from pathlib import Path
    
    print(f"🔍 Message endpoint called:")
    print(f"   session_id: {session_id}")
    print(f"   content: '{content}'")
    print(f"   image: {image.filename if image else 'None'}")
    print(f"   user: {current_user.email}")
    
    # 세션 확인
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        print(f"❌ Session {session_id} not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    image_path = None
    
    # 이미지 업로드 처리
    if image:
        # uploads 디렉토리 생성
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        # 파일명 생성 (시간스탬프 + 원본 파일명)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{image.filename}"
        file_path = upload_dir / filename
        
        # 파일 저장
        with open(file_path, "wb") as buffer:
            content_data = await image.read()
            buffer.write(content_data)
        
        image_path = str(file_path)
        
        # 데이터베이스에 이미지 정보 저장 (선택적)
        try:
            db_image = UploadedImage(
                session_id=session_id,
                filename=image.filename,
                filepath=image_path
            )
            db.add(db_image)
            db.flush()  # 테이블 존재 여부 확인
        except Exception as e:
            # UploadedImage 테이블이 없어도 계속 진행
            print(f"Warning: Could not save image metadata: {e}")
            db.rollback()
    
    # 사용자 메시지 저장
    user_message = Message(
        session_id=session_id,
        content=content,
        is_user=True,
        image_path=image_path
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    try:
        # 과목 정보 가져오기
        subject = db.query(Subject).filter(Subject.id == session.subject_id).first()
        subject_name = subject.name if subject else "수학"
        
        # 대화 히스토리 가져오기 (최근 10개 메시지)
        conversation_history = []
        recent_messages = db.query(Message).filter(
            Message.session_id == session_id
        ).order_by(Message.created_at.desc()).limit(10).all()
        
        for msg in reversed(recent_messages):  # 시간순으로 정렬
            conversation_history.append({
                'content': msg.content,
                'is_user': msg.is_user
            })
        
        # 이미지가 있는 경우 PIL Image 객체로 변환
        pil_image = None
        if image_path:
            try:
                pil_image = Image.open(image_path)
            except Exception as e:
                print(f"Warning: Could not load image {image_path}: {e}")
        
        # AI 응답 생성
        ai_response_content = await ai_service.generate_response(
            subject_name=subject_name,
            message_text=content,
            conversation_history=conversation_history,
            image=pil_image
        )
        
    except Exception as e:
        print(f"AI response generation error: {e}")
        ai_response_content = "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해 주세요."
    
    # AI 응답 메시지 저장
    ai_message = Message(
        session_id=session_id,
        content=ai_response_content,
        is_user=False
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    return {
        "id": ai_message.id,
        "content": ai_message.content,
        "is_user": ai_message.is_user,
        "created_at": ai_message.created_at.isoformat(),
        "image_path": user_message.image_path
    }

@app.get("/chat-sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify session belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    messages = db.query(Message).filter(Message.session_id == session_id).all()
    return [MessageResponse(
        id=message.id,
        session_id=message.session_id,
        content=message.content,
        is_user=message.is_user,
        image_path=f"/uploads/{os.path.basename(message.image_path)}" if message.image_path else None,
        image_url=f"http://localhost:8000/uploads/{os.path.basename(message.image_path)}" if message.image_path else None,
        created_at=message.created_at
    ) for message in messages]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)