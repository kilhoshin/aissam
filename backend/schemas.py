from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    grade: str  # 고1, 고2, 고3

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    grade: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Subject schemas
class SubjectResponse(BaseModel):
    id: int
    name: str
    color: str
    icon: str
    
    class Config:
        from_attributes = True

# Chat session schemas
class ChatSessionCreate(BaseModel):
    subject_id: int
    title: Optional[str] = None

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    subject_id: int
    subject: SubjectResponse
    title: str
    message_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Message schemas
class MessageCreate(BaseModel):
    content: str
    image_path: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    session_id: int
    content: str
    is_user: bool
    image_path: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
