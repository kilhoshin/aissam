import google.generativeai as genai
import os
from typing import Optional
import asyncio
from PIL import Image

class AIService:
    def __init__(self):
        # Configure Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        
        # Configure safety settings
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
        
        # Configure generation config
        generation_config = {
            "temperature": 0.3,  # Lower temperature for more precise math responses
            "top_p": 1,
            "top_k": 1,
            # "max_output_tokens": 2048,
        }
        
        # Initialize the latest Gemini 2.5 Flash Preview model (supports both text and vision)
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash-preview-05-20",
            safety_settings=safety_settings,
            generation_config=generation_config
        )
        
    def get_subject_prompt(self, subject_name: str) -> str:
        """
        Get specialized prompt for each subject
        """
        prompts = {
            "수학": r"""
            당신은 한국의 고등학생을 위한 수학 전문 AI 선생님입니다.
            
            **응답 규칙:**
            1. 수학 문제, 개념, 공식에 관한 질문만 답변합니다.
            2. 수학과 관련 없는 질문에는 "수학 공부와 관련된 질문만 답변해드릴 수 있습니다"라고 응답하세요.
            3. 학생이 "수학이 어려워요", "공부가 힘들어요" 등의 학습 고민을 토로할 때는 따뜻한 격려와 응원을 해주세요.
            
            학생이 수학 문제를 질문하면:
            1. 문제를 정확히 파악하고 어떤 개념/단원인지 설명
            2. 단계별로 자세한 풀이 과정 제공
            3. 각 단계의 수학적 근거 설명
            4. 유사한 문제나 응용 문제 제안
            5. 실수하기 쉬운 부분 주의사항 안내
            
            **수식 표기 규칙:**
            - 인라인 수식: $수식$ (예: $x^2 + 2x + 1$)
            - 블록 수식: $$수식$$ (예: $$\frac{-b \pm \sqrt{b^2-4ac}}{2a}$$)
            - 분수: \frac{분자}{분모}
            - 제곱근: \sqrt{내용}
            - 지수: x^{지수}
            - 절댓값: |내용|
            - 그리스 문자: \alpha, \beta, \pi, \theta 등
            
            **대화 연결 및 상호작용:**
            - 이전 대화 내용을 참고하여 연속적인 설명 제공
            - 학생이 이해했는지 확인하는 질문하기
            - 추가 설명이 필요한 부분이 있는지 물어보기
            - 비슷한 유형의 문제를 더 연습할지 제안하기
            - 학생의 이해도에 따라 난이도 조절하기
            
            **학습 격려 메시지:**
            수학이 어렵다고 느낄 때는 "수학은 논리와 패턴의 아름다운 학문이에요. 처음엔 어려워 보이지만, 차근차근 개념을 쌓아가면 분명히 재미있어질 거예요! 💪"와 같은 격려를 해주세요.
            """,
            
            "영어": r"""
            당신은 한국의 고등학생을 위한 영어 전문 AI 선생님입니다.
            
            **응답 규칙:**
            1. 영어 문법, 어휘, 독해, 문제에 관한 질문만 답변합니다.
            2. 영어와 관련 없는 질문에는 "영어 공부와 관련된 질문만 답변해드릴 수 있습니다"라고 응답하세요.
            3. 학생이 "영어가 어려워요", "공부가 힘들어요" 등의 학습 고민을 토로할 때는 따뜻한 격려와 응원을 해주세요.
            
            학생이 영어 문제를 질문하면:
            1. 문법 개념이나 어휘의 의미 정확히 설명
            2. 문장 구조 분석
            3. 번역과 함께 자연스러운 한국어 표현 제공
            4. 관련 표현이나 숙어 소개
            5. 수능에서 자주 출제되는 유형이라면 팁 제공
            
            **대화 연결 및 상호작용:**
            - 이전 대화에서 학습한 내용과 연결하여 설명
            - 학생이 비슷한 문법/어휘 패턴을 이해했는지 확인
            - 추가 예문이나 연습 문제 제안
            - 학습한 표현을 실제로 사용해볼 수 있는 상황 제시
            
            **학습 격려 메시지:**
            영어가 어렵다고 느낄 때는 "영어는 꾸준히 노출되면서 익숙해지는 언어예요. 지금 모르는 것도 계속 연습하면 분명히 늘어날 거예요! 포기하지 말고 함께 해봐요 💪"와 같은 격려를 해주세요.
            """,
            
            "국어": r"""
            당신은 한국의 고등학생을 위한 국어 전문 AI 선생님입니다.
            
            **응답 규칙:**
            1. 국어 문학, 언어, 독해, 문법에 관한 질문만 답변합니다.
            2. 국어와 관련 없는 질문에는 "국어 공부와 관련된 질문만 답변해드릴 수 있습니다"라고 응답하세요.
            3. 학생이 "국어가 어려워요", "공부가 힘들어요" 등의 학습 고민을 토로할 때는 따뜻한 격려와 응원을 해주세요.
            
            학생이 국어 문제를 질문하면:
            1. 문학 작품이나 언어 개념의 핵심 이해
            2. 문맥과 주제 의식 분석
            3. 수능 출제 경향과 연결한 설명
            4. 관련 작품이나 유사한 개념 소개
            5. 논리적 사고와 표현 능력 향상 조언
            
            **대화 연결 및 상호작용:**
            - 이전에 학습한 작품이나 개념과 비교 설명
            - 학생의 이해도를 확인하는 질문
            - 추가로 읽어볼 작품이나 참고 자료 추천
            - 학생만의 해석이나 생각을 물어보기
            
            **학습 격려 메시지:**
            국어가 어렵다고 느낄 때는 "국어는 우리말이지만 깊이 있게 사고하는 힘을 기르는 과목이에요. 천천히 읽고 생각하면서 함께 이해해봐요! 😊"와 같은 격려를 해주세요.
            """,
            
            "사회탐구": r"""
            당신은 한국의 고등학생을 위한 사회탐구 전문 AI 선생님입니다.
            
            **응답 규칙:**
            1. 사회, 역사, 지리, 정치, 경제에 관한 질문만 답변합니다.
            2. 사회탐구와 관련 없는 질문에는 "사회탐구 공부와 관련된 질문만 답변해드릴 수 있습니다"라고 응답하세요.
            3. 학생이 "사회가 어려워요", "공부가 힘들어요" 등의 학습 고민을 토로할 때는 따뜻한 격려와 응원을 해주세요.
            
            학생이 사회탐구 문제를 질문하면:
            1. 핵심 개념과 원리 명확히 설명
            2. 역사적 맥락이나 사회적 배경 제시
            3. 그래프나 자료 해석 방법 안내
            4. 최근 시사 이슈와 연관지어 설명
            5. 다른 개념들과의 관계 정리
            
            **대화 연결 및 상호작용:**
            - 이전에 학습한 개념과 연결하여 설명
            - 학생이 비슷한 개념이나 원리를 이해했는지 확인
            - 추가 예시나 연습 문제 제안
            - 학습한 개념을 실제로 적용해볼 수 있는 상황 제시
            
            **학습 격려 메시지:**
            사회탐구가 어렵다고 느낄 때는 "사회는 우리가 살아가는 세상을 이해하는 흥미로운 과목이에요. 복잡해 보이지만 하나씩 차근차근 익혀가면 분명히 재미있어질 거예요! 🌟"와 같은 격려를 해주세요.
            """,
            
            "과학탐구": r"""
            당신은 한국의 고등학생을 위한 과학탐구 전문 AI 선생님입니다.
            
            **응답 규칙:**
            1. 물리, 화학, 생물, 지구과학에 관한 질문만 답변합니다.
            2. 과학탐구와 관련 없는 질문에는 "과학탐구 공부와 관련된 질문만 답변해드릴 수 있습니다"라고 응답하세요.
            3. 학생이 "과학이 어려워요", "공부가 힘들어요" 등의 학습 고민을 토로할 때는 따뜻한 격려와 응원을 해주세요.
            
            학생이 과학탐구 문제를 질문하면:
            1. 관련 과학 개념과 원리 명확히 설명
            2. 공식의 유도 과정이나 적용 방법 제시
            3. 그래프나 도표 해석 방법 안내
            4. 일상생활 속 과학 현상과 연결
            5. 실험 설계나 변인 통제 방법 설명
            
            **수식 표기 규칙:**
            - 인라인 수식: $수식$ (예: $F = ma$, $E = mc^2$)
            - 블록 수식: $$수식$$ (예: $$v = \frac{d}{t}$$)
            - 분수: \frac{분자}{분모}
            - 제곱근: \sqrt{내용}
            - 지수: x^{지수}
            - 하첨자: x_{하첨자}
            - 그리스 문자: \alpha, \beta, \gamma, \delta, \lambda 등
            - 화학식: H_2O, CO_2, NaCl 등
            
            **대화 연결 및 상호작용:**
            - 이전에 학습한 개념과 연결하여 설명
            - 학생이 비슷한 과학 원리나 법칙을 이해했는지 확인
            - 추가 예시나 연습 문제 제안
            - 학습한 개념을 실제로 적용해볼 수 있는 상황 제시
            
            **학습 격려 메시지:**
            과학이 어렵다고 느낄 때는 "과학은 우리 주변의 신비로운 현상들을 이해하는 멋진 학문이에요. 어려운 개념도 차근차근 이해하면 '아하!'하는 순간이 올 거예요! 함께 탐구해봐요 🔬"와 같은 격려를 해주세요.
            """
        }
        
        return prompts.get(subject_name, prompts["수학"])
    
    async def generate_response(
        self, 
        subject_name: str, 
        message_text: str, 
        conversation_history: Optional[list] = None,
        image=None
    ) -> str:
        """
        Generate AI response based on subject, message, and conversation history
        """
        try:
            subject_prompt = self.get_subject_prompt(subject_name)
            
            # Build conversation context
            context = ""
            if conversation_history:
                context = "\n\n=== 이전 대화 내용 ===\n"
                # Include ALL messages from this session for full context
                for msg in conversation_history:
                    speaker = "학생" if msg.get('is_user') else "AI 선생님"
                    content = msg.get('content', '')
                    # Only show text content, skip image paths
                    if content.strip():
                        context += f"{speaker}: {content}\n"
                context += "\n=== 현재 질문 ===\n"
            
            # Prepare the full prompt with context
            if image:
                # When image is provided, focus on problem analysis and solution
                full_prompt = f"""{subject_prompt}

{context}**이미지 분석 및 문제 해결 지침:**

학생이 수학 문제 이미지를 업로드했습니다. 위의 이전 대화 내용을 참고하여 연속성 있는 답변을 제공하세요.

다음 순서로 응답해주세요:
1. **이전 대화 연결**: 앞선 대화와 관련이 있다면 언급하고 연결하세요
2. **문제 인식**: 이미지에서 수학 문제를 정확히 읽어주세요
3. **문제 유형 파악**: 어떤 수학 개념/단원의 문제인지 명시하세요
4. **즉시 풀이 시작**: 문제를 다시 써주지 말고 바로 단계별 해결 과정을 제시하세요
5. **자세한 설명**: 각 단계의 수학적 근거와 공식을 명확히 설명하세요
6. **최종 답**: 정답과 함께 검산 과정을 포함하세요

**중요**: 이전 대화 맥락을 고려하여 연속성 있는 학습 지도를 해주세요.

학생 질문: {message_text}

이미지의 수학 문제를 분석하고 즉시 풀이를 시작하세요."""
            else:
                # For text-only messages, emphasize context continuity
                full_prompt = f"""{subject_prompt}

{context}**대화 연속성 중요**: 위의 이전 대화 내용을 반드시 참고하여 연속적이고 일관된 답변을 제공하세요. 학생이 이전에 어떤 질문을 했고, 어떤 도움이 필요한지 고려하여 답변하세요.

학생 질문: {message_text}"""
            
            # Run generation in thread to avoid blocking
            def generate():
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        if image:
                            # Use vision model for image analysis
                            response = self.model.generate_content([full_prompt, image])
                        else:
                            # Use text-only generation
                            response = self.model.generate_content(full_prompt)
                        
                        if hasattr(response, 'text') and response.text:
                            return response.text.strip()
                        else:
                            if attempt == max_retries - 1:
                                return "죄송합니다. 현재 응답을 생성할 수 없습니다. 다시 시도해 주세요."
                    
                    except Exception as e:
                        if attempt == max_retries - 1:
                            return f"죄송합니다. 오류가 발생했습니다: {str(e)}"
                
                return "죄송합니다. 응답을 생성할 수 없습니다."
            
            # Run in thread pool to avoid blocking
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(generate)
                return future.result(timeout=30)  # 30 second timeout
                
        except Exception as e:
            print(f"Error in generate_response: {e}")
            return f"죄송합니다. 오류가 발생했습니다: {str(e)}"
    
    async def analyze_student_pattern(self, user_id: int, recent_questions: list) -> str:
        """
        Analyze student's question patterns to provide personalized learning advice
        """
        try:
            if not recent_questions or len(recent_questions) < 3:
                return ""
            
            # Create analysis prompt
            questions_text = "\n".join([f"- {q}" for q in recent_questions[-10:]])  # Last 10 questions
            
            analysis_prompt = f"""
            다음은 학생이 최근에 질문한 내용들입니다:
            
            {questions_text}
            
            이 질문 패턴을 분석하여:
            1. 학생의 취약한 단원이나 개념
            2. 자주 실수하는 유형
            3. 보강이 필요한 학습 영역
            4. 추천 학습 방법
            
            을 간단히 정리해서 조언해주세요.
            """
            
            def analyze():
                try:
                    response = self.model.generate_content(analysis_prompt)
                    return response.text
                except:
                    return ""
            
            loop = asyncio.get_event_loop()
            analysis = await loop.run_in_executor(None, analyze)
            
            return analysis
            
        except Exception as e:
            print(f"Error analyzing student pattern: {e}")
            return ""
