from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uvicorn
from datetime import datetime, timedelta
from typing import Optional, List
import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

from database import SessionLocal, engine, Base
from models import User, Subject, ChatSession, Message, UploadedImage
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

# CORS 설정 - 임시로 모든 도메인 허용 (디버깅용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        grade=user.grade
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        grade=db_user.grade
    )

@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
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

@app.post("/chat-sessions/{session_id}/messages", response_model=MessageResponse)
async def send_message(
    session_id: int,
    message_text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
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
    
    # Process image if provided
    image_path = ""
    
    if image:
        # Save uploaded image
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        image_path = f"{upload_dir}/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{image.filename}"
        
        with open(image_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)
        
        # Save image metadata
        db_image = UploadedImage(
            session_id=session_id,
            filename=image.filename,
            filepath=image_path
        )
        db.add(db_image)
        db.commit()
    
    # Create user message
    user_message = Message(
        session_id=session_id,
        content=message_text or "",
        is_user=True,
        image_path=image_path if image else None
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Get subject info for AI context
    subject = db.query(Subject).filter(Subject.id == session.subject_id).first()
    
    # Get conversation history for context (ALL messages from this session)
    previous_messages = db.query(Message).filter(
        Message.session_id == session_id
    ).order_by(Message.created_at.desc()).all()
    
    # Convert to list format for AI service (reverse to chronological order)
    conversation_history = []
    for msg in reversed(previous_messages):
        conversation_history.append({
            'content': msg.content,
            'is_user': msg.is_user,
            'created_at': msg.created_at.isoformat()
        })
    
    # Generate AI response with conversation context
    from PIL import Image
    image_for_ai = None
    if image_path:
        image_for_ai = Image.open(image_path)
        # Resize if too large
        if image_for_ai.width > 1024 or image_for_ai.height > 1024:
            image_for_ai.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        # Convert to RGB if needed
        if image_for_ai.mode != 'RGB':
            image_for_ai = image_for_ai.convert('RGB')
    
    ai_response = await ai_service.generate_response(
        subject_name=subject.name,
        message_text=user_message.content,
        conversation_history=conversation_history,
        image=image_for_ai
    )
    
    # Create AI message
    ai_message = Message(
        session_id=session_id,
        content=ai_response,
        is_user=False
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    return MessageResponse(
        id=ai_message.id,
        session_id=ai_message.session_id,
        content=ai_message.content,
        is_user=ai_message.is_user,
        image_path=ai_message.image_path,
        image_url=f"http://localhost:8000/uploads/{os.path.basename(user_message.image_path)}" if user_message.image_path else None,
        created_at=ai_message.created_at
    )

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
    uvicorn.run(app, host="0.0.0.0", port=8000)