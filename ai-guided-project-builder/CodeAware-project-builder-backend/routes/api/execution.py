from fastapi import APIRouter, HTTPException, Body
import logging
import traceback
from typing import Dict

from models.schemas import CodeRequest, StepCompletionRequest, QuestionRequest
from utils.helpers import generate_quiz_verification
from services.project.project_service import ProjectService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

def get_execution_service():
    from app import get_execution_service
    return get_execution_service()

def get_project_service():
    from app import get_google_api_key
    return ProjectService(get_google_api_key())

def get_session_service():
    from app import get_session_service
    return get_session_service()

@router.post("/execute")
async def execute_code(request: CodeRequest):
    """Execute code in the specified language"""
    execution_service = get_execution_service()
    
    try:
        # If there's a session ID provided, increment execution attempts
        if hasattr(request, 'session_id') and request.session_id:
            session_service = get_session_service()
            session_service.increment_execution_attempts(request.session_id)
            
        result = execution_service.execute_code(request.code, request.language)
        return result
    except Exception as e:
        error_detail = f"Error executing code: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

@router.post("/render_website")
async def render_website(html_code: str = Body(..., embed=True), css_code: str = Body(..., embed=True), session_id: str = Body(None, embed=True)):
    """Render an HTML website with CSS"""
    try:
        execution_service = get_execution_service()
        logger.debug(f"Rendering website with HTML length {len(html_code)} and CSS length {len(css_code)}")
        
        # If there's a session ID provided, increment execution attempts
        if session_id:
            session_service = get_session_service()
            session_service.increment_execution_attempts(session_id)
            
        result = execution_service.render_website(html_code, css_code)
        return result
    except Exception as e:
        error_detail = f"Error rendering website: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

@router.post("/verify_step_completion")
async def verify_step_completion(request: StepCompletionRequest):
    """Verify the user's understanding of a completed step using multiple choice questions"""
    try:
        # Get the user's answers and generate verification results
        verification_result = generate_quiz_verification(request.user_answers)
        
        return verification_result
    except Exception as e:
        error_detail = f"Error verifying step: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

@router.post("/ask_question")
async def ask_question(request: QuestionRequest):
    """Answer a user's question about code or a step"""
    try:
        # Get services
        project_service = get_project_service()
        session_service = get_session_service()
        
        # Check if session exists
        session = session_service.get_session(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session not found: {request.session_id}")
        
        # Get the number of execution attempts for the current step
        execution_attempts = session_service.get_current_step_execution_attempts(request.session_id)
        
        # Determine question type and response approach
        show_solution = execution_attempts >= 4  # Show solution if 4+ attempts made
        
        # Prepare the base context for all question types
        context = f"""
        I'm building a project using {request.project_type} with expertise level {session["expertise_level"]}.
        Project idea: {session["project_idea"]}
        
        Here is my current code:
        ```
        {request.code}
        ```
        
        My question is: {request.question}
        """
        
        # Trial message to be added to responses
        trial_message = f"This is your {execution_attempts}{'st' if execution_attempts == 1 else 'nd' if execution_attempts == 2 else 'rd' if execution_attempts == 3 else 'th'} attempt! "
        
        # Prepare prompt for Gemini based on question type and execution attempts
        if request.is_error_related:
            if show_solution:
                # User has made many attempts - provide the full solution
                prompt = f"""
                {context}
                
                The user has made {execution_attempts} attempts to solve this problem.
                Since they've been struggling, provide a complete solution with detailed code.
                Be very clear and thorough in explaining both the error and how to fix it.
                
                Start your response with "{trial_message}" followed by an encouraging message like "Keep going!" or "You're making progress!".
                Then provide your detailed solution.
                """
            else:
                # User is still early in debugging - provide hints only
                prompt = f"""
                {context}
                
                The user has made only {execution_attempts} attempts to solve this problem.
                DO NOT give them the full solution yet. Instead, provide helpful debugging hints
                that will guide them toward fixing the error on their own.
                
                Start your response with "{trial_message}" followed by an encouraging message like "Keep trying!" or "You're on the right track!".
                
                Focus on:
                1. What might be causing the error
                2. General approaches to fix it
                3. Documentation references or concepts they should look up
                
                DO NOT provide any direct code solutions or exact fixes.
                """
        else:
            # For general explanation questions, provide complete information
            prompt = f"""
            {context}
            
            Start your response with "{trial_message}" followed by a brief acknowledgment of their question.
            
            Please provide a helpful answer to this general question, considering the user's expertise level.
            Include code examples if relevant to illustrate concepts, but focus on explaining the concepts clearly.
            """
        
        # Call Gemini API through project service
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        
        # For questions, we don't need to process JSON, so return as is
        return {
            "response": response.text
        }
    except Exception as e:
        error_detail = f"Error generating answer: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

@router.get("/get_step_attempts")
async def get_step_attempts(session_id: str, step_number: int):
    """Get the number of execution attempts for a specific step"""
    try:
        # Get session service
        session_service = get_session_service()
        
        # Get session
        session = session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        # Get attempts by step
        step_key = str(step_number)
        attempts = session["execution_attempts_by_step"].get(step_key, 0)
        
        return {"attempts": attempts}
    except Exception as e:
        error_detail = f"Error getting step attempts: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

@router.post("/terminate_streamlit")
async def terminate_streamlit(request: Dict):
    """API endpoint to terminate a running Streamlit process"""
    execution_id = request.get("execution_id")
    if not execution_id:
        raise HTTPException(status_code=400, detail="Missing execution_id")
    
    execution_service = get_execution_service()
    success = execution_service.terminate_streamlit_process(execution_id)
    return {"success": success} 