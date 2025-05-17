import os
import google.generativeai as genai
from dotenv import load_dotenv
from app.models.task import DifficultyLevel
import logging
from typing import Dict, Any, List
import re
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize model as None
model = None

def initialize_gemini():
    global model
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        logger.info("Gemini API initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini API: {str(e)}")
        raise

# Initialize Gemini on module import
try:
    initialize_gemini()
except Exception as e:
    logger.error(f"Failed to initialize Gemini API during startup: {str(e)}")

def get_prompt_by_difficulty(description: str, difficulty: DifficultyLevel) -> str:
    base_prompt = f"Generate code scaffolding for the following task: {description}\n"
    
    if difficulty == DifficultyLevel.BEGINNER:
        return base_prompt + """
        Please provide:
        1. Detailed code structure with comments
        2. Step-by-step implementation guide
        3. Example usage
        4. Common pitfalls to avoid
        Format the response as a code block with TODO comments.
        """
    elif difficulty == DifficultyLevel.INTERMEDIATE:
        return base_prompt + """
        Please provide:
        1. Basic code structure
        2. Key functions and their purposes
        3. Main implementation points
        Format the response as a code block with TODO comments.
        """
    else:  # EXPERT
        return base_prompt + """
        Please provide:
        1. Minimal code structure
        2. High-level implementation points
        Format the response as a code block with TODO comments.
        """

async def generate_code_scaffolding(task_description: str, difficulty_level: str, language: str, use_boilerplate: bool = False, concept_keywords: List[str] = None) -> Dict[str, Any]:
    """
    Generate code scaffolding based on the task description and difficulty level.
    """
    if not model:
        try:
            initialize_gemini()
        except Exception as e:
            raise Exception("Failed to initialize Gemini API. Please check your API key.")

    try:
        # If it's newbie mode, we want to use the newbie prompt regardless of use_boilerplate
        if difficulty_level == "newbie":
            # Incorporate concept keywords if provided
            concept_parts = ""
            if concept_keywords:
                concept_parts = f"""
                Important: Make sure the user needs to implement the following concepts:
                {', '.join(concept_keywords)}
                
                For each of these concepts, leave those parts of the code empty with clear TODO comments.
                """
            
            prompt = f"""Generate code scaffolding for a newbie programmer learning to implement the following task in {language}:
            Task: {task_description}
            
            CRITICAL REQUIREMENT: You MUST leave 30-50% of the functions COMPLETELY EMPTY with ONLY function signatures, docstrings, and TODO comments.
            
            Requirements for the NEWBIE level:
            1. Create a PARTIAL implementation where:
                - Implement ONLY 50-70% of the functions or code parts completely
                - Leave AT LEAST 30% of the functions COMPLETELY EMPTY (with ONLY signatures, docstrings, and TODOs)
                - DO NOT provide ANY implementation inside empty functions - just function signature, docstring and TODOs
                - For empty functions, ONLY include detailed TODO comments explaining what needs to be done
            
            2. Select which functions to leave empty:
                - EMPTY: Functions that teach core programming concepts (loops, conditionals, data structures)
                - EMPTY: Functions that implement the primary algorithm or logic of the task
                - IMPLEMENTED: Helper functions, utility functions, and display/output functions
                - IMPLEMENTED: Main program flow and structure should be clear
            
            3. For empty functions, include:
                - ONLY the function signature with parameters
                - A detailed docstring explaining parameters and return values
                - TODO comments explaining step-by-step how to approach the problem
                - NO actual code implementation at all - let the student write ALL the code
            
            4. Example of a properly empty function:
            ```
            def find_max_value(numbers):
                \"\"\"Find the maximum value in a list of numbers.
                
                Args:
                    numbers: List of integers
                    
                Returns:
                    The maximum value in the list
                \"\"\"
                # TODO: Implement the function to find the maximum value in the list
                # TODO: 1. Initialize a variable to track the maximum
                # TODO: 2. Loop through each number in the list
                # TODO: 3. If current number is larger than max, update max
                # TODO: 4. Return the maximum value after checking all numbers
                # TODO: Hint: Consider edge cases like empty lists
            ```
            
            CRITICAL WARNING: DO NOT DO THIS:
            ```
            def get_computer_move(board):
                \"\"\"Gets a valid move from the computer.\"\"\"
                # TODO: Implement the computer's move logic here.
                # The computer should choose a random available spot.
                
                # WRONG - Don't provide implementation like this:
                available_moves = [i + 1 for i, spot in enumerate(board) if spot == ' ']
                if not available_moves:
                    return None
                return random.choice(available_moves)
            ```
            
            For empty functions, provide ONLY the function signature, docstring, and TODO comments. DO NOT include ANY implementation code at all, not even as examples or placeholders.
            
            {concept_parts}
            
            5. Functions that MUST be left empty (pick 2-4 based on task complexity):
                - Core algorithm functions
                - Functions implementing main game logic
                - Functions handling data processing
                - Functions implementing key concepts
            
            6. Include 5 specific hints related ONLY to the empty functions you left for the user to implement
            
            Return the code in the following JSON format:
            {{
                "scaffolding": "The partially implemented code with empty functions",
                "hints": ["Hint 1 for empty function", "Hint 2 for empty function", "Hint 3 for empty function", "Hint 4 for empty function", "Hint 5 for empty function"]
            }}
            
            Important: Return ONLY the JSON object, no other text, markdown formatting, or backticks."""
        elif use_boilerplate:
            # If we have concept keywords, we'll skip those parts in the code
            skip_parts = ""
            if concept_keywords:
                skip_parts = f"""
                Important: DO NOT include implementation for the following concepts in the code:
                {', '.join(concept_keywords)}
                
                Instead, add TODO comments for these parts, like:
                # TODO: Implement {concept_keywords[0]} here
                """

            prompt = f"""Generate ONLY the basic boilerplate code structure for the following programming task in {language}:
            Task: {task_description}
            
            Requirements:
            1. Provide ONLY simple function structure (NO classes)
            2. Include basic function names and parameters
            3. Include basic docstrings
            4. For Python: use simple functions and if __name__ == '__main__'
            5. For JavaScript: use simple functions and basic console.log
            6. For Java/C++/C#: use simple functions and main method
            7. DO NOT include any implementation logic
            8. DO NOT include any hints or comments about implementation
            9. Return the code in the following JSON format:
            {{
                "scaffolding": "The boilerplate code",
                "hints": []
            }}
            
            {skip_parts}
            
            Important: 
            - Return ONLY the JSON object, no other text, markdown formatting, or backticks
            - Keep the code structure very simple and beginner-friendly
            - NO classes or complex structures
            - Just basic functions and main entry point"""
        else:
            prompt = f"""Generate code scaffolding for the following programming task in {language}:
            Task: {task_description}
            
            Requirements for EXPERT level:
               - Provide complete implementation
               - Include all necessary logic
               - Include detailed comments
               - Include error handling
               - Include best practices
               - DO NOT include any hints
            
            Return the code in the following JSON format:
            {{
                "scaffolding": "The code",
                "hints": []  # No hints for expert level
            }}
            
            Important: Return ONLY the JSON object, no other text, markdown formatting, or backticks."""

        response = await model.generate_content_async(prompt)
        
        if not response or not response.text:
            raise ValueError("No response from AI model")
        
        # Clean the response text to ensure it's valid JSON
        response_text = response.text.strip()
        
        # Remove any markdown code block indicators
        response_text = response_text.replace('```json', '').replace('```', '')
        
        # Remove any language specifiers
        response_text = response_text.replace('```python', '').replace('```javascript', '').replace('```java', '')
        
        # Remove any leading/trailing whitespace
        response_text = response_text.strip()
        
        # Try to extract JSON from the response
        try:
            # First try to parse the entire response as JSON
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If that fails, try to find JSON-like structure
            try:
                # Look for content between curly braces
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    # If no JSON found, create a default structure
                    result = {
                        "scaffolding": response_text,
                        "hints": []
                    }
            except (json.JSONDecodeError, AttributeError):
                # If all parsing attempts fail, create a default structure
                result = {
                    "scaffolding": response_text,
                    "hints": []
                }
        
        # Validate and clean up the result
        if not isinstance(result, dict):
            result = {"scaffolding": str(result), "hints": []}
        
        if "scaffolding" not in result:
            result["scaffolding"] = response_text
        
        if not isinstance(result["scaffolding"], str):
            result["scaffolding"] = str(result["scaffolding"])
        
        # Clean up the code
        code = result["scaffolding"]
        code = code.strip()
        
        # Handle hints based on difficulty level
        if difficulty_level == "newbie":
            if "hints" not in result or not isinstance(result["hints"], list):
                result["hints"] = []
            
            # Ensure we have exactly 5 hints
            if len(result["hints"]) < 5:
                # Generate additional hints if needed
                additional_hints = await generate_additional_hints(task_description, language, 5 - len(result["hints"]))
                result["hints"].extend(additional_hints)
            result["hints"] = result["hints"][:5]  # Limit to 5 hints
        else:
            result["hints"] = []  # No hints for expert level or boilerplate
        
        # Update the result with cleaned code
        result["scaffolding"] = code
        
        return result
    
    except Exception as e:
        logger.error(f"Error generating code: {str(e)}")
        # Return a default structure instead of raising an error
        return {
            "scaffolding": f"# Default code template for {language}\n\ndef main():\n    pass\n\nif __name__ == '__main__':\n    main()",
            "hints": []
        }

async def generate_additional_hints(task_description: str, language: str, num_hints: int) -> List[str]:
    """Generate additional hints for a task."""
    try:
        prompt = f"""Generate {num_hints} helpful hints for implementing the following task in {language}:
        Task: {task_description}
        
        Requirements for hints:
        1. Each hint should be specific and actionable
        2. Hints should guide the user step by step
        3. Hints should not reveal the complete solution
        4. Hints should focus on one concept at a time
        5. Return the hints as a JSON array of strings
        
        Return format:
        ["Hint 1", "Hint 2", ...]
        
        Important: Return ONLY the JSON array, no other text."""
        
        response = await model.generate_content_async(prompt)
        if not response or not response.text:
            return []
            
        hints_text = response.text.strip()
        hints_text = hints_text.replace('```json', '').replace('```', '').strip()
        
        try:
            hints = json.loads(hints_text)
            if isinstance(hints, list):
                return hints[:num_hints]
            return []
        except json.JSONDecodeError:
            # If JSON parsing fails, try to extract hints from the text
            hints = []
            lines = hints_text.split('\n')
            for line in lines:
                line = line.strip()
                if line and not line.startswith('[') and not line.startswith(']'):
                    hints.append(line)
            return hints[:num_hints]
            
    except Exception as e:
        logger.error(f"Error generating additional hints: {str(e)}")
        return [] 