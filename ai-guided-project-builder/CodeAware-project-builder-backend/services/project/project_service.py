import json
import logging
import google.generativeai as genai
from typing import Dict, List, Optional, Any
import traceback

from models.schemas import ProjectStep, ProjectData

# Configure logging
logger = logging.getLogger(__name__)

class ProjectService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        
    def extract_json_from_response(self, text: str) -> Dict:
        """Extract JSON from a response that might be wrapped in markdown code blocks."""
        import re
        
        # Try direct JSON parsing first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Look for JSON inside markdown code blocks
        json_pattern = r"```(?:json)?\s*([\s\S]*?)```"
        matches = re.findall(json_pattern, text)
        
        if matches:
            for match in matches:
                try:
                    return json.loads(match.strip())
                except json.JSONDecodeError:
                    continue
        
        # Try to find anything that looks like JSON object 
        json_object_pattern = r"\{[\s\S]*\}"
        matches = re.findall(json_object_pattern, text)
        
        if matches:
            for match in matches:
                try:
                    return json.loads(match)
                except json.JSONDecodeError:
                    continue
                    
        # Return the original text if we couldn't extract JSON
        return {"error": "Could not extract valid JSON", "original_text": text}

    def generate_project_prompt(self, project_type: str, expertise_level: str, project_idea: str) -> str:
        """Generate a prompt for creating a project based on user requirements"""
        
        # Determine appropriate number of steps based on project complexity
        # Use keywords in the project idea to estimate complexity
        complexity_keywords = {
            "simple": 6,
            "basic": 6,
            "beginner": 6,
            "easy": 6,
            "straightforward": 6,
            "intermediate": 8,
            "moderate": 8,
            "medium": 8,
            "complex": 10,
            "advanced": 10, 
            "sophisticated": 10,
            "comprehensive": 12,
            "complete": 12,
            "full": 12,
            "extensive": 12
        }
        
        # Default to 8 steps
        suggested_steps = 8
        
        # Adjust steps based on project idea complexity
        if project_idea:
            project_idea_lower = project_idea.lower()
            for keyword, steps in complexity_keywords.items():
                if keyword in project_idea_lower:
                    suggested_steps = steps
                    break
                    
            # Adjust based on expertise level
            if expertise_level == "beginner":
                suggested_steps = max(6, suggested_steps - 1)  # Beginners get fewer steps
            elif expertise_level == "expert":
                suggested_steps = min(12, suggested_steps + 1)  # Experts can handle more steps
                
            # Adjust based on project type
            if "dashboard" in project_idea_lower or "visualization" in project_idea_lower:
                suggested_steps = min(12, suggested_steps + 1)  # Visualization projects need more steps
            if "game" in project_idea_lower:
                suggested_steps = min(12, suggested_steps + 2)  # Games are more complex
                
        logger.debug(f"Determined {suggested_steps} steps for project: {project_idea}")
        
        prompt = f"""
        I want to build a project using {project_type}. My expertise level is {expertise_level}.
        {f"Specifically, I want to build: {project_idea}" if project_idea else "Please suggest a good beginner-friendly project for me."}
        
        I need a project broken down into multiple small steps (levels) where each level completes a small part of the project, like a game with different levels.
        
        Please format the content of each step differently based on my expertise level:
        - beginner: Provide small code snippets with detailed explanation of each line
        - intermediate: Provide text instructions first with full steps of what to do (don't give code initially)
        - expert: Provide only workflow description, very minimal guidance
        
        Please provide:
        1. A brief introduction to the project
        2. A clear breakdown of steps to complete it (approximately {suggested_steps} different steps/levels)
        3. The first step with detailed explanation in the appropriate format for my expertise level
        
        IMPORTANT: ALL STEPS MUST BE DIRECTLY RELATED TO "{project_idea}" AND BUILD ON EACH OTHER SEQUENTIALLY.
        THE PROJECT SHOULD BE FULLY COMPLETE BY THE FINAL STEP.
        
        Format your response as a JSON object with these fields:
        - project_title: A descriptive name for the {project_idea} project
        - project_description: A brief overview of what we're building
        - total_steps: Total number of steps to complete the project (should be around {suggested_steps})
        - steps: An array of step objects, where each step has:
          - step_number: The numerical order of this step (1, 2, 3, etc.)
          - title: Step title
          - description: Detailed explanation formatted for my expertise level
          - language: The programming language for this step (html, css, javascript, python)
          - code: Starter code for this step (for beginners), or empty for intermediate/expert
          - expected_outcome: What should happen after completing this step
          - quiz_questions: An array of quiz questions, each with:
            - question_id: unique ID for the question
            - question_text: the specific question about THIS step's content
            - options: array of 4 possible answers
            - correct_answer: the correct option exactly as written in options
        
        For this request, just include the first step in the 'steps' array.
        
        IMPORTANT: Return only the raw JSON without any markdown formatting or code blocks. Do not include ```json or ``` around your response. Return only valid, parseable JSON.
        """
        return prompt
    
    def generate_next_step_prompt(self, project_type: str, expertise_level: str, project_idea: str, 
                                current_step: int, user_code: Optional[str] = None, 
                                user_question: Optional[str] = None, 
                                user_understanding: Optional[str] = None) -> str:
        """Generate a prompt for the next step in a project"""
        prompt = f"""
        I'm building a project using {project_type} with expertise level {expertise_level}.
        Project idea: {project_idea}
        
        I have completed step {current_step} and here is my code:
        ```
        {user_code or "No code provided"}
        ```
        
        {f"I have a question: {user_question}" if user_question else ""}
        
        {f"This is my understanding of the step: {user_understanding}" if user_understanding else ""}
        
        Please provide step {current_step + 1} for the "{project_idea}" project with:
        1. Detailed feedback on my current code - be specific about what I did well and what could be improved
        2. Detailed explanation of the next step, formatted based on my expertise level:
          - beginner: Provide small code snippets with detailed explanation of each line
          - intermediate: Provide text instructions first with full steps of what to do (don't give code initially)
          - expert: Provide only workflow description, very minimal guidance
        3. Starter code for the next step (if I'm a beginner)
        
        IMPORTANT: 
        - This step MUST continue building on the previous step and be directly related to the "{project_idea}" project
        - Include specific details about how this step connects to and builds upon the previous step
        - The step should be a logical progression in building the {project_idea} project
        
        Format your response as a JSON object with these fields:
        - step_number: {current_step + 1}
        - title: Step title
        - feedback: Feedback on the user's current code
        - description: Detailed explanation of this step
        - language: The programming language for this step (html, css, javascript, python)
        - code: Starter code for this step (detailed for beginners, minimal or empty for others)
        - expected_outcome: What should happen after completing this step
        - quiz_questions: An array of quiz questions, each with:
          - question_id: unique ID for the question
          - question_text: the specific question about THIS step's content
          - options: array of 4 possible answers
          - correct_answer: the correct option exactly as written in options
        
        IMPORTANT: Return only the raw JSON without any markdown formatting or code blocks. Do not include ```json or ``` around your response. Return only valid, parseable JSON.
        """
        return prompt
    
    def generate_project_steps(self, project_type: str, expertise_level: str, project_idea: str) -> Dict:
        """Generate project steps based on user input"""
        try:
            prompt = self.generate_project_prompt(project_type, expertise_level, project_idea)
            
            logger.debug("Initializing Gemini model for project generation")
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2
                }
            )
            
            logger.debug(f"Received response from Gemini API for project generation")
            
            # Process the response to extract clean JSON
            response_text = response.text
            
            # Try to extract JSON from the response
            try:
                json_data = self.extract_json_from_response(response_text)
                # Validate the step structure is correct and has required fields
                self._validate_project_data(json_data)
                return json_data
            except Exception as json_error:
                logger.error(f"Error extracting JSON from response: {str(json_error)}")
                raise Exception(f"Failed to parse project data: {str(json_error)}")
                
        except Exception as e:
            logger.error(f"Error generating project: {str(e)}\n{traceback.format_exc()}")
            raise Exception(f"Failed to generate project: {str(e)}")
    
    def generate_next_step(self, project_type: str, expertise_level: str, project_idea: str, 
                          current_step: int, user_code: Optional[str] = None,
                          user_question: Optional[str] = None, 
                          user_understanding: Optional[str] = None) -> Dict:
        """Generate the next step for a project"""
        try:
            prompt = self.generate_next_step_prompt(
                project_type, expertise_level, project_idea, 
                current_step, user_code, user_question, user_understanding
            )
            
            # Call Gemini API
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2
                }
            )
            
            # Extract JSON from response
            response_text = response.text
            json_data = self.extract_json_from_response(response_text)
            
            # Validate the step has required fields
            self._validate_step_data(json_data)
            
            return json_data
        
        except Exception as e:
            logger.error(f"Error generating next step: {str(e)}\n{traceback.format_exc()}")
            raise Exception(f"Failed to generate next step: {str(e)}")
    
    def generate_quiz_questions(self, step_data: Dict) -> List[Dict]:
        """Generate quiz questions for a specific step"""
        try:
            # If step already has quiz questions, use those
            if "quiz_questions" in step_data and step_data["quiz_questions"]:
                return step_data["quiz_questions"]
            
            # Otherwise generate new questions based on step content
            prompt = f"""
            Generate 2-3 multiple choice questions about the following step in a coding project.
            
            The step is about: {step_data.get('title', 'Coding step')}
            Step description: {step_data.get('description', 'No description available')}
            
            These questions should:
            1. Test understanding of key concepts from this specific step ONLY
            2. Be simple and straightforward
            3. Each have exactly 4 possible answers with only one correct answer
            4. Cover different aspects of what was taught in this step
            
            Respond with a JSON array of question objects, each containing:
            {{
                "question_id": "q1", // unique ID for the question
                "question_text": "the question text",
                "options": ["option1", "option2", "option3", "option4"],
                "correct_answer": "the correct option exactly as written in options"
            }}
            
            Only return the JSON array with no additional text.
            """
            
            # Call Gemini for generating questions
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                prompt,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2
                }
            )
            
            # Process the response
            json_data = self.extract_json_from_response(response.text)
            
            # If we didn't get an array, wrap it
            if not isinstance(json_data, list):
                if isinstance(json_data, dict):
                    json_data = [json_data]
                else:
                    # Fallback questions if parsing failed
                    json_data = [
                        {
                            "question_id": "q1",
                            "question_text": f"What is the main topic of the step '{step_data.get('title')}'?",
                            "options": ["HTML basics", "CSS styling", "JavaScript functions", "Python coding"],
                            "correct_answer": "HTML basics"  # Default
                        },
                        {
                            "question_id": "q2",
                            "question_text": f"What is the expected outcome of this step?",
                            "options": ["A styled webpage", "A functional form", "Basic HTML structure", "Running Python code"],
                            "correct_answer": "Basic HTML structure"  # Default
                        }
                    ]
            
            return json_data
            
        except Exception as e:
            logger.error(f"Error generating questions: {str(e)}")
            # Fallback with simple questions
            return [
                {
                    "question_id": "q1",
                    "question_text": f"What is the main topic of the step '{step_data.get('title')}'?",
                    "options": ["HTML basics", "CSS styling", "JavaScript functions", "Python coding"],
                    "correct_answer": "HTML basics"  # Default
                },
                {
                    "question_id": "q2",
                    "question_text": f"What is the expected outcome of this step?",
                    "options": ["A styled webpage", "A functional form", "Basic HTML structure", "Running Python code"],
                    "correct_answer": "Basic HTML structure"  # Default
                }
            ]
    
    def _validate_project_data(self, data: Dict) -> None:
        """Validate that project data has all required fields"""
        required_fields = ["project_title", "project_description", "total_steps", "steps"]
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field in project data: {field}")
        
        if not isinstance(data["steps"], list):
            raise ValueError("Steps must be a list")
        
        if len(data["steps"]) < 1:
            raise ValueError("Project must have at least one step")
        
        # Validate first step
        self._validate_step_data(data["steps"][0])
    
    def _validate_step_data(self, data: Dict) -> None:
        """Validate that step data has all required fields"""
        required_fields = ["title", "description", "expected_outcome"]
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field in step data: {field}") 