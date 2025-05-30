from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uvicorn
from datetime import datetime, timedelta
import time
from typing import Optional, List
import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

from database import SessionLocal, engine
from models import User, Subject, ChatSession, Message, UploadedImage, Base
from schemas import (
    UserCreate, UserResponse, Token, ChatSessionCreate, ChatSessionResponse,
    MessageCreate, MessageResponse, SubjectResponse
)
from auth import (
    authenticate_user, create_access_token, get_current_user,
    get_password_hash, verify_password
)
from ai_service import AIService

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AISSAM API", version="1.0.0")

# Create uploads directory if it doesn't exist
uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Add CORS middleware
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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_service = AIService()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(hours=24)  # 30분에서 24시간으로 변경
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

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
    
    # 세션 확인
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
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
        
        # 데이터베이스에 이미지 정보 저장
        db_image = UploadedImage(
            session_id=session_id,
            filename=image.filename,
            filepath=image_path
        )
        db.add(db_image)
    
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
    
    # AI 응답 생성 (임시)
    ai_response_content = f"이미지와 함께 받은 질문: '{content}'"
    if image:
        ai_response_content += f"\n이미지 파일명: {image.filename}"
    ai_response_content += "\n\n죄송합니다. 현재 AI 모델이 연결되지 않아 임시 응답을 드립니다. 곧 실제 AI 튜터 기능이 추가될 예정입니다."
    
    ai_message = Message(
        session_id=session_id,
        content=ai_response_content,
        is_user=False
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    return {
        "user_message": {
            "id": user_message.id,
            "content": user_message.content,
            "is_user": user_message.is_user,
            "image_path": user_message.image_path,
            "created_at": user_message.created_at
        },
        "ai_message": {
            "id": ai_message.id,
            "content": ai_message.content,
            "is_user": ai_message.is_user,
            "created_at": ai_message.created_at
        }
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