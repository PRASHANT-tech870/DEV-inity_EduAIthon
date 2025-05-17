from fastapi import APIRouter, HTTPException, Depends
from app.models.task import TaskRequest, ProgrammingLanguage
from app.services.ai_service import generate_code_scaffolding
from app.services.code_executor import execute_code
from app.services.quiz_service import generate_quiz, check_quiz_answers
from app.services.learning_service import generate_learning_content
from app.services.code_service import analyze_code
import logging
import uuid
from typing import Dict, Any, List
import time
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for quiz questions (in a real app, use Redis or a database)
quiz_sessions = {}

# Cleanup old sessions (older than 2 hours)
def cleanup_old_sessions():
    current_time = time.time()
    to_delete = []
    for session_id, data in quiz_sessions.items():
        if current_time - data["created_at"] > 7200:  # 2 hours
            to_delete.append(session_id)
    
    for session_id in to_delete:
        del quiz_sessions[session_id]
        logger.info(f"Cleaned up old session: {session_id}")

@router.post("/generate_scaffolding")
async def generate_scaffolding(request: TaskRequest):
    try:
        if not request.task_description:
            raise HTTPException(status_code=400, detail="Task description is required")
        
        if not request.difficulty_level:
            raise HTTPException(status_code=400, detail="Difficulty level is required")
        
        if not request.language:
            raise HTTPException(status_code=400, detail="Programming language is required")
        
        logger.info(f"Generating scaffolding for task: {request.task_description}")
        
        # Get concept keywords from request if available
        concept_keywords = getattr(request, 'concept_keywords', None)
        
        # If coming from learning page, force newbie level for boilerplate code
        use_boilerplate = getattr(request, 'use_boilerplate', False)
        if use_boilerplate:
            logger.info("Generating boilerplate code")
            request.difficulty_level = "newbie"
            # Force boilerplate code generation
            result = await generate_code_scaffolding(
                request.task_description,
                "newbie",  # Force newbie level
                request.language,
                use_boilerplate=True,  # Add this flag to force boilerplate
                concept_keywords=concept_keywords  # Pass concept keywords
            )
        else:
            logger.info(f"Generating complete code for difficulty level: {request.difficulty_level}")
            result = await generate_code_scaffolding(
                request.task_description,
                request.difficulty_level,
                request.language,
                concept_keywords=concept_keywords  # Pass concept keywords
            )
            
        if not result or "scaffolding" not in result:
            logger.error("Failed to generate valid code")
            raise HTTPException(status_code=500, detail="Failed to generate valid code")
            
        # Log the generated code length for debugging
        logger.info(f"Generated code length: {len(result['scaffolding'])}")
        
        return {
            "scaffolding": result["scaffolding"],
            "hints": result.get("hints", [])
        }
    except Exception as e:
        logger.error(f"Error generating scaffolding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run_code")
async def run_code(request: dict):
    try:
        if not request.get("code"):
            raise HTTPException(status_code=400, detail="Code is required")
        
        if not request.get("language"):
            raise HTTPException(status_code=400, detail="Programming language is required")
        
        try:
            language = ProgrammingLanguage(request["language"])
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid programming language. Must be one of: {', '.join([lang.value for lang in ProgrammingLanguage])}"
            )
        
        logger.info(f"Running code in {language.value}")
        output = await execute_code(request["code"], language)
        
        return {"output": output}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze_code")
async def analyze_code_endpoint(request: dict):
    try:
        if not request.get("code"):
            raise HTTPException(status_code=400, detail="Code is required")
        
        if not request.get("language"):
            raise HTTPException(status_code=400, detail="Programming language is required")
            
        if not request.get("task_description"):
            raise HTTPException(status_code=400, detail="Task description is required")
        
        try:
            language = ProgrammingLanguage(request["language"])
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid programming language. Must be one of: {', '.join([lang.value for lang in ProgrammingLanguage])}"
            )
        
        logger.info(f"Analyzing code in {language.value}")
        
        # First execute the code to determine if it's working
        has_execution_errors = False
        try:
            output = await execute_code(request["code"], language)
            # Check for common error patterns in the output
            execution_error_patterns = [
                "error", "exception", "traceback", "syntax error", "runtime error",
                "indexerror", "keyerror", "attributeerror", "typeerror", "nameerror",
                "valueerror", "syntaxerror", "indentationerror", "fail"
            ]
            
            has_execution_errors = any(pattern in output.lower() for pattern in execution_error_patterns)
            
            logger.info(f"Code execution result - Has errors: {has_execution_errors}")
            if has_execution_errors:
                logger.info(f"Execution errors detected in output: {output[:200]}...")
                
        except Exception as e:
            has_execution_errors = True
            output = str(e)
            logger.info(f"Exception during code execution: {str(e)}")
        
        # Get a logical code correctness analysis from the AI service
        # We use this approach because execution success doesn't always mean the code is correct
        # for the specific task
        analysis_result = await analyze_code(
            request["code"], 
            request["task_description"], 
            language.value, 
            has_errors=has_execution_errors
        )
        
        return {"analysis": analysis_result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_quiz")
async def generate_quiz_endpoint(request: dict):
    try:
        if not request.get("task_description"):
            raise HTTPException(status_code=400, detail="Task description is required")
        if not request.get("language"):
            raise HTTPException(status_code=400, detail="Language is required")
        
        # Clean up old sessions
        cleanup_old_sessions()
        
        # Generate a unique session ID for this quiz
        session_id = str(uuid.uuid4())
        
        # Generate questions
        questions = await generate_quiz(request["task_description"], request["language"])
        
        # Store questions in memory with session ID
        quiz_sessions[session_id] = {
            "questions": questions,
            "task_description": request["task_description"],
            "language": request["language"],
            "created_at": time.time()  # Current timestamp
        }
        
        logger.info(f"Generated quiz with session ID: {session_id}")
        
        # Return questions with session ID
        return {
            "questions": questions,
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check_quiz")
async def check_quiz_endpoint(request: dict):
    try:
        if not request.get("session_id"):
            raise HTTPException(status_code=400, detail="Session ID is required")
        if not request.get("answers"):
            raise HTTPException(status_code=400, detail="Answers are required")
        
        session_id = request["session_id"]
        
        # Check if session exists
        if session_id not in quiz_sessions:
            raise HTTPException(status_code=404, detail="Quiz session not found. Please generate a new quiz.")
        
        # Get stored questions
        session_data = quiz_sessions[session_id]
        questions = session_data["questions"]
        
        # Log the answers received from the frontend
        logger.info(f"Checking answers for session {session_id}")
        
        # Check answers using stored questions
        result = await check_quiz_answers(questions, request["answers"])
        
        # Log the result for debugging
        logger.info(f"Quiz check result: {result}")
        
        return result
    except Exception as e:
        logger.error(f"Error checking quiz answers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_learning")
async def generate_learning_endpoint(request: dict):
    try:
        if not request.get("task_description"):
            raise HTTPException(status_code=400, detail="Task description is required")
        if not request.get("language"):
            raise HTTPException(status_code=400, detail="Language is required")
        
        # Log the request
        logger.info(f"Generating learning content for task: {request['task_description']}")
        
        # Process wrong answers if provided
        wrong_answers = request.get("wrong_answers", [])
        if wrong_answers:
            logger.info(f"Processing {len(wrong_answers)} wrong answers")
        
        try:
            content = await generate_learning_content(
                request["task_description"], 
                request["language"],
                wrong_answers
            )
            
            # Validate the response structure
            if not isinstance(content, dict):
                logger.error("Invalid content format returned from learning service")
                raise HTTPException(status_code=500, detail="Invalid content format returned from learning service")
            
            # Ensure all required fields exist
            if "sections" not in content:
                content["sections"] = []
            if "wrong_answers" not in content:
                content["wrong_answers"] = []
            if "concept_keywords" not in content:
                content["concept_keywords"] = []
            
            return {"content": content}
        except Exception as e:
            logger.error(f"Error in learning content generation: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in generate_learning_endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 