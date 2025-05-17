from fastapi import APIRouter, HTTPException, Body
import logging
import json
import traceback
from typing import Dict, Any

from models.schemas import ProjectRequest, StepRequest
from services.project.project_service import ProjectService
from services.project.session_service import SessionService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

def get_project_service():
    from app import get_google_api_key
    return ProjectService(get_google_api_key())

def get_session_service():
    from app import get_session_service
    return get_session_service()

@router.post("/start_project")
async def start_project(request: ProjectRequest):
    """Start a new project based on user specifications"""
    try:
        logger.debug(f"Starting project with: project_type={request.project_type}, expertise_level={request.expertise_level}, project_idea={request.project_idea}")
        
        # Get services
        project_service = get_project_service()
        session_service = get_session_service()
        
        # Generate project steps
        project_data = project_service.generate_project_steps(
            request.project_type, 
            request.expertise_level,
            request.project_idea or "Simple Project"
        )
        
        # Convert to JSON string for storage
        gemini_response = json.dumps(project_data)
        
        # Create a session
        session_id = session_service.create_session(
            request.project_type,
            request.expertise_level,
            request.project_idea or "AI suggested project",
            gemini_response
        )
        
        return {
            "session_id": session_id,
            "response": gemini_response
        }
    except Exception as e:
        error_detail = f"Error generating project: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

@router.post("/next_step")
async def get_next_step(request: Dict[str, Any]):
    """Get the next step of a project"""
    try:
        # Convert the dict to a StepRequest model
        step_request = StepRequest(**request)
        session_id = step_request.session_id
        
        # Get services
        project_service = get_project_service()
        session_service = get_session_service()
        
        # Check if session exists
        session = session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        current_step = step_request.current_step
        next_step = current_step + 1
        
        # Validate that user has written code for the current step
        if not step_request.user_code or step_request.user_code.strip() == "":
            raise HTTPException(
                status_code=400, 
                detail="Please write some code for the current step before proceeding to the next step."
            )
        
        # Check if we've reached the total number of steps
        total_steps = session.get("total_steps", 10)
        
        # If this is the final step, return completion message
        if next_step > total_steps:
            logger.debug(f"Reached end of project with {total_steps} steps. Sending completion message.")
            
            # Generate a completion message based on the project
            project_type = session.get("project_type", "")
            project_idea = session.get("project_idea", "")
            
            completion_message = f"Congratulations! You have successfully completed your {project_idea} project. "
            
            if "html+css+js" in project_type:
                completion_message += "You've built a complete web application from scratch, learning HTML structure, CSS styling, and JavaScript functionality along the way."
            elif "python+streamlit" in project_type:
                completion_message += "You've created a fully functional data application with Python and Streamlit, learning key concepts in data visualization and interactive dashboards."
            else:
                completion_message += "You've mastered each step of the development process and now have a complete project to showcase your skills."
                
            return {
                "session_id": session_id,
                "response": json.dumps({
                    "project_completed": True,
                    "message": completion_message
                })
            }
        
        # Save the user's code
        if step_request.user_code:
            session_service.store_user_code(session_id, step_request.user_code)
        
        # Generate the next step
        next_step_data = project_service.generate_next_step(
            step_request.project_type,
            step_request.expertise_level,
            step_request.project_idea,
            current_step,
            step_request.user_code,
            step_request.user_question,
            step_request.user_understanding
        )
        
        # Ensure correct step numbering
        from utils.helpers import format_step_title
        if "title" in next_step_data:
            next_step_data["title"] = format_step_title(next_step, next_step_data["title"])
        
        # Make sure step_number is correctly set in the data
        next_step_data["step_number"] = next_step
        
        # Update the current step in the session
        session_service.update_session(session_id, {
            "current_step": next_step,
            "current_step_data": next_step_data  # Store the current step data for quiz generation
        })
        
        return {
            "session_id": session_id,
            "response": json.dumps(next_step_data)
        }
    except Exception as e:
        error_detail = f"Error generating next step: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail)

@router.post("/get_step_questions")
async def get_step_questions(request: Dict[str, Any]):
    """Generate quiz questions for the current step"""
    try:
        session_id = request.get("session_id")
        step_number = request.get("step_number")
        
        # Get services
        project_service = get_project_service()
        session_service = get_session_service()
        
        # Check if session exists
        session = session_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
        
        # Parse the gemini response to get the current step data
        if 'gemini_response' not in session:
            raise HTTPException(status_code=404, detail="Session data not found")
        
        # Get step content, either from the first step in the initial response 
        # or from generated responses stored in the session
        response_object = json.loads(session['gemini_response'])
        
        # Find current step data to generate questions for
        step_data = None
        
        # Determine where to get the step data from
        if step_number == 0 and "steps" in response_object and len(response_object["steps"]) > 0:
            # For the first step, we can use the step from the initial project response
            step_data = response_object["steps"][0]
            logger.debug(f"Found step data for step 0 in initial project response")
        elif "current_step_data" in session and session.get("current_step") == step_number:
            # For subsequent steps, use the current step data stored in the session
            step_data = session.get("current_step_data")
            logger.debug(f"Found step data in session: current_step_data for step {step_number}")
        
        # If we still don't have step data, try to fallback to other sources
        if not step_data:
            logger.debug(f"No step data found for step {step_number}, trying fallbacks")
            
            # Check if we have the step data in projectSteps array in session
            if "projectSteps" in session and isinstance(session["projectSteps"], list):
                step_index = step_number
                if 0 <= step_index < len(session["projectSteps"]):
                    step_data = session["projectSteps"][step_index]
                    logger.debug(f"Found step data in projectSteps array")
            
            # If still no step data, create a default one based on project information
            if not step_data:
                logger.debug(f"Creating default step data based on project info")
                project_type = session.get("project_type", "unknown")
                project_idea = session.get("project_idea", "Project")
                
                # Create a basic step data object with project information
                step_data = {
                    "title": f"Step {step_number + 1} for {project_idea}",
                    "description": f"Building a {project_idea} using {project_type}",
                    "language": "html" if project_type == "html+css+js" else "python"
                }
        
        if step_data:
            # Generate quiz questions about this step
            questions = project_service.generate_quiz_questions(step_data)
            logger.debug(f"Generated {len(questions)} quiz questions for step {step_number}")
            
            return {
                "questions": questions
            }
        else:
            # If no step data found, use a generic step to generate questions
            logger.warning(f"No step data found for step {step_number}, using generic questions")
            generic_step = {
                "title": f"Step {step_number + 1}",
                "description": "Building your project step by step"
            }
            questions = project_service.generate_quiz_questions(generic_step)
            
            return {
                "questions": questions
            }
        
    except Exception as e:
        error_detail = f"Error getting questions: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        raise HTTPException(status_code=500, detail=error_detail) 