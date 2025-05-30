#!/usr/bin/env python3
"""
데이터베이스 마이그레이션 스크립트
기존 테이블에 새 컬럼들을 추가합니다.
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def migrate_database():
    """데이터베이스에 누락된 컬럼들을 추가"""
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("DATABASE_URL 환경변수가 설정되지 않았습니다.")
        return False
    
    # PostgreSQL URL 형식 변환
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # 트랜잭션 시작
            trans = conn.begin()
            
            try:
                print("데이터베이스 마이그레이션 시작...")
                
                # 1. messages 테이블에 image_path 컬럼 추가
                print("1. messages 테이블에 image_path 컬럼 추가...")
                try:
                    conn.execute(text("""
                        ALTER TABLE messages 
                        ADD COLUMN image_path VARCHAR NULL
                    """))
                    print("   ✅ image_path 컬럼 추가 완료")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print("   ⚠️ image_path 컬럼이 이미 존재합니다")
                    else:
                        print(f"   ❌ image_path 컬럼 추가 실패: {e}")
                
                # 2. subjects 테이블 생성 (존재하지 않는 경우)
                print("2. subjects 테이블 확인/생성...")
                try:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS subjects (
                            id SERIAL PRIMARY KEY,
                            name VARCHAR NOT NULL,
                            color VARCHAR NOT NULL,
                            icon VARCHAR NOT NULL
                        )
                    """))
                    print("   ✅ subjects 테이블 확인/생성 완료")
                except Exception as e:
                    print(f"   ❌ subjects 테이블 생성 실패: {e}")
                
                # 3. chat_sessions 테이블 생성 (존재하지 않는 경우)
                print("3. chat_sessions 테이블 확인/생성...")
                try:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS chat_sessions (
                            id SERIAL PRIMARY KEY,
                            user_id INTEGER NOT NULL REFERENCES users(id),
                            subject_id INTEGER NOT NULL REFERENCES subjects(id),
                            title VARCHAR NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    print("   ✅ chat_sessions 테이블 확인/생성 완료")
                except Exception as e:
                    print(f"   ❌ chat_sessions 테이블 생성 실패: {e}")
                
                # 4. uploaded_images 테이블 생성 (존재하지 않는 경우)
                print("4. uploaded_images 테이블 확인/생성...")
                try:
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS uploaded_images (
                            id SERIAL PRIMARY KEY,
                            session_id INTEGER NOT NULL REFERENCES chat_sessions(id),
                            filename VARCHAR NOT NULL,
                            filepath VARCHAR NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                    print("   ✅ uploaded_images 테이블 확인/생성 완료")
                except Exception as e:
                    print(f"   ❌ uploaded_images 테이블 생성 실패: {e}")
                
                # 5. 기본 subjects 데이터 삽입
                print("5. 기본 과목 데이터 확인/삽입...")
                try:
                    # 기존 데이터 확인
                    result = conn.execute(text("SELECT COUNT(*) FROM subjects"))
                    count = result.scalar()
                    
                    if count == 0:
                        conn.execute(text("""
                            INSERT INTO subjects (name, color, icon) VALUES
                            ('수학', '#3B82F6', 'calculator'),
                            ('영어', '#EF4444', 'globe'),
                            ('국어', '#10B981', 'book'),
                            ('사회탐구', '#F97316', 'building'),
                            ('과학탐구', '#8B5CF6', 'beaker')
                        """))
                        print("   ✅ 기본 과목 데이터 삽입 완료")
                    else:
                        print(f"   ⚠️ 이미 {count}개의 과목이 존재합니다")
                except Exception as e:
                    print(f"   ❌ 기본 과목 데이터 삽입 실패: {e}")
                
                # 트랜잭션 커밋
                trans.commit()
                print("🎉 데이터베이스 마이그레이션 완료!")
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ 마이그레이션 실패, 롤백됨: {e}")
                return False
                
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return False

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
