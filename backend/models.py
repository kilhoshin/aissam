from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)  # 사용자 이름
    _hashed_password = Column('hashed_password', String)
    grade = Column(String)  # 1학년, 2학년, 3학년
    created_at = Column(DateTime, default=datetime.utcnow)
    
    @property
    def hashed_password(self):
        if isinstance(self._hashed_password, bytes):
            return self._hashed_password.decode('utf-8')
        return self._hashed_password
    
    @hashed_password.setter
    def hashed_password(self, value):
        if isinstance(value, bytes):
            self._hashed_password = value.decode('utf-8')
        else:
            self._hashed_password = value
    
    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="user")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # 수학, 영어, 국어, 사회탐구, 과학탐구
    color = Column(String, nullable=False)  # Hex color code
    icon = Column(String, nullable=False)   # Icon name
    
    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="subject")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    subject = relationship("Subject", back_populates="chat_sessions")
    messages = relationship("Message", back_populates="session")
    uploaded_images = relationship("UploadedImage", back_populates="session")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_user = Column(Boolean, default=True)  # True for user messages, False for AI responses
    image_path = Column(String, nullable=True)  # Path to uploaded image if any
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")

class UploadedImage(Base):
    __tablename__ = "uploaded_images"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("ChatSession", back_populates="uploaded_images")
