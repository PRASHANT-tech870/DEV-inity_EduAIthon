import uuid
import json
import logging
from typing import Dict, List, Optional, Any

# Configure logging
logger = logging.getLogger(__name__)

class SessionService:
    def __init__(self):
        # Store user sessions
        self.user_sessions = {}
        
        # Store user code files - indexed by session_id
        self.user_code_files = {}
    
    def create_session(self, project_type: str, expertise_level: str, project_idea: str, gemini_response: str) -> str:
        """Create a new user session and return the session ID"""
        # Generate a session ID
        session_id = str(uuid.uuid4())
        
        # Parse the gemini response to get project details
        try:
            response_data = json.loads(gemini_response)
            total_steps = response_data.get("total_steps", 10)
        except json.JSONDecodeError:
            total_steps = 10  # Default if parsing fails
        
        # Store session data
        self.user_sessions[session_id] = {
            "project_type": project_type,
            "expertise_level": expertise_level,
            "project_idea": project_idea or "AI suggested project",
            "current_step": 0,
            "gemini_response": gemini_response,
            "total_steps": total_steps,
            "execution_attempts": 0,  # Track how many times code was executed
            "execution_attempts_by_step": {}  # Track execution attempts per step
        }
        
        # Initialize empty code files for this session
        self.user_code_files[session_id] = {
            "html": "",
            "css": "",
            "javascript": "",
            "python": ""
        }
        
        logger.debug(f"Created new session with ID: {session_id}")
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Get a user session by ID"""
        return self.user_sessions.get(session_id)
    
    def update_session(self, session_id: str, data: Dict) -> bool:
        """Update a user session with new data"""
        if session_id not in self.user_sessions:
            return False
            
        self.user_sessions[session_id].update(data)
        return True
    
    def increment_step(self, session_id: str) -> bool:
        """Increment the current step for a session"""
        if session_id not in self.user_sessions:
            return False
            
        self.user_sessions[session_id]["current_step"] += 1
        return True
    
    def increment_execution_attempts(self, session_id: str) -> int:
        """Increment the execution attempts counter and return the new count"""
        if session_id not in self.user_sessions:
            return 0
            
        # Increment the global execution counter
        self.user_sessions[session_id]["execution_attempts"] += 1
        
        # Also track attempts for the current step
        current_step = self.user_sessions[session_id]["current_step"]
        step_key = str(current_step)  # Convert to string for dictionary key
        
        # Initialize the step counter if it doesn't exist
        if step_key not in self.user_sessions[session_id]["execution_attempts_by_step"]:
            self.user_sessions[session_id]["execution_attempts_by_step"][step_key] = 0
            
        # Increment step counter
        self.user_sessions[session_id]["execution_attempts_by_step"][step_key] += 1
        
        # Return the count for the current step
        return self.user_sessions[session_id]["execution_attempts_by_step"][step_key]
    
    def get_execution_attempts(self, session_id: str) -> int:
        """Get the total number of execution attempts for a session"""
        if session_id not in self.user_sessions:
            return 0
            
        return self.user_sessions[session_id]["execution_attempts"]
    
    def get_current_step_execution_attempts(self, session_id: str) -> int:
        """Get the number of execution attempts for the current step"""
        if session_id not in self.user_sessions:
            return 0
            
        current_step = self.user_sessions[session_id]["current_step"]
        step_key = str(current_step)
        
        return self.user_sessions[session_id]["execution_attempts_by_step"].get(step_key, 0)
    
    def store_code(self, session_id: str, code: str, language: str) -> bool:
        """Store user code for a specific language"""
        if session_id not in self.user_code_files:
            return False
            
        if language not in self.user_code_files[session_id]:
            return False
            
        self.user_code_files[session_id][language] = code
        return True
    
    def get_code(self, session_id: str, language: str) -> Optional[str]:
        """Get stored user code for a specific language"""
        if session_id not in self.user_code_files:
            return None
            
        return self.user_code_files[session_id].get(language)
    
    def detect_language(self, code: str) -> str:
        """Detect the programming language from code content"""
        if not code:
            return "unknown"
            
        if "<html" in code or "<body" in code or "<div" in code:
            return "html"
        elif "{" in code and ("font" in code or "color" in code or "margin" in code):
            return "css"
        elif "function" in code or "var " in code or "const " in code or "let " in code:
            return "javascript"
        elif "import" in code or "def " in code or "print(" in code:
            return "python"
        else:
            return "unknown"
    
    def store_user_code(self, session_id: str, user_code: str) -> bool:
        """Store user code by detecting the language"""
        if not user_code or session_id not in self.user_code_files:
            return False
            
        language = self.detect_language(user_code)
        if language == "unknown":
            # Try to determine based on project type
            if session_id in self.user_sessions:
                project_type = self.user_sessions[session_id]["project_type"]
                if project_type == "html+css+js":
                    language = "html"  # Default to HTML for web projects
                else:
                    language = "python"  # Default to Python for Streamlit projects
            else:
                return False
                
        return self.store_code(session_id, user_code, language) 