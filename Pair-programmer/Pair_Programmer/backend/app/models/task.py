from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERT = "expert"

class ProgrammingLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    CSHARP = "csharp"
    GO = "go"
    RUST = "rust"
    PHP = "php"
    RUBY = "ruby"
    SWIFT = "swift"

class TaskRequest(BaseModel):
    task_description: str = Field(..., min_length=1, description="Description of the coding task")
    difficulty_level: str = Field(..., description="Difficulty level of the task")
    language: ProgrammingLanguage = Field(..., description="Programming language to use")
    use_boilerplate: bool = Field(False, description="Whether to generate boilerplate code")
    concept_keywords: Optional[List[str]] = Field(None, description="List of concepts to skip in code generation")

    class Config:
        json_schema_extra = {
            "example": {
                "task_description": "Write a function to calculate factorial",
                "difficulty_level": "beginner",
                "language": "python",
                "use_boilerplate": False,
                "concept_keywords": ["recursion", "error handling"]
            }
        } 