from pydantic import BaseModel, ValidationError
from typing import Optional, List, Dict, Any

class CodeRequest(BaseModel):
    code: str
    language: str
    session_id: Optional[str] = None

class ProjectRequest(BaseModel):
    project_type: str  # "python+streamlit" or "html+css+js"
    expertise_level: str  # "beginner", "intermediate", "expert"
    project_idea: Optional[str] = None
    current_step: Optional[int] = 0

class StepRequest(BaseModel):
    project_type: str
    expertise_level: str
    project_idea: str
    current_step: int
    user_code: Optional[str] = None
    user_question: Optional[str] = None
    session_id: str
    user_understanding: Optional[str] = None

class QuestionRequest(BaseModel):
    question: str
    code: str
    project_type: str
    session_id: str
    is_error_related: Optional[bool] = False

class StepCompletionRequest(BaseModel):
    session_id: str
    step_number: int
    user_answers: List[dict]  # Changed from user_understanding to user_answers

class QuizQuestion(BaseModel):
    question_id: str
    question_text: str
    options: List[str]
    correct_answer: str

class ProjectStep(BaseModel):
    step_number: int
    title: str
    description: str
    language: str
    code: str = ""
    expected_outcome: str
    quiz_questions: Optional[List[QuizQuestion]] = []
    feedback: Optional[str] = None

class ProjectData(BaseModel):
    project_title: str
    project_description: str
    total_steps: int
    steps: List[ProjectStep] 