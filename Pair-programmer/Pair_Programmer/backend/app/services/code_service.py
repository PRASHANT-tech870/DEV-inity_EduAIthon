import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging
import json
from typing import Dict, Any, List

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

async def generate_code(task_description: str, language: str, use_boilerplate: bool = False) -> Dict[str, Any]:
    """
    Generate code for the task, either complete implementation or boilerplate.
    """
    if not model:
        try:
            initialize_gemini()
        except Exception as e:
            raise Exception("Failed to initialize Gemini API. Please check your API key.")

    try:
        prompt = f"""Generate {language} code for the following task:
        Task: {task_description}
        
        Requirements:
        1. Generate {'boilerplate code with TODO comments' if use_boilerplate else 'complete, working implementation'}
        2. Include necessary imports and dependencies
        3. Add clear comments explaining the code
        4. Follow best practices for {language}
        5. Return the code in the following JSON format:
        {{
            "code": "The complete code as a string",
            "dependencies": ["list", "of", "required", "packages"],
            "setup_instructions": "Instructions for setting up and running the code"
        }}
        
        Important: 
        - Return ONLY the JSON object, no other text, markdown formatting, or backticks
        - The 'code' field must be a string containing the complete code
        - Make sure the JSON is properly formatted and valid
        - For Python, include all necessary imports
        - For JavaScript, include any required npm packages
        - For other languages, include their respective package managers
        - If generating boilerplate code:
          * Add TODO comments for each major step
          * Include basic structure and imports
          * Add comments explaining what needs to be implemented
          * Make sure the code is runnable even if incomplete"""

        response = await model.generate_content_async(prompt)
        
        if not response or not response.text:
            raise ValueError("No response from AI model")
        
        # Clean the response text to ensure it's valid JSON
        response_text = response.text.strip()
        # Remove any markdown code block indicators
        response_text = response_text.replace('```json', '').replace('```', '')
        # Remove any leading/trailing whitespace
        response_text = response_text.strip()
        
        # Parse the JSON response
        try:
            content = json.loads(response_text)
            if not isinstance(content, dict):
                raise ValueError("Response is not a dictionary")
            if "code" not in content:
                raise ValueError("Response missing 'code' field")
            if not isinstance(content["code"], str):
                raise ValueError("'code' must be a string")
            if "dependencies" not in content:
                raise ValueError("Response missing 'dependencies' field")
            if not isinstance(content["dependencies"], list):
                raise ValueError("'dependencies' must be a list")
            if "setup_instructions" not in content:
                raise ValueError("Response missing 'setup_instructions' field")
            if not isinstance(content["setup_instructions"], str):
                raise ValueError("'setup_instructions' must be a string")
            
            # Add hints for boilerplate code
            if use_boilerplate:
                content["hints"] = [
                    "Complete the TODO comments in the code",
                    "Add necessary error handling",
                    "Test your implementation with different inputs",
                    "Make sure to handle edge cases",
                    "Add proper documentation for your functions"
                ]
            
            return content
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing code JSON: {str(e)}")
            logger.error(f"Raw response: {response_text}")
            raise ValueError("Failed to parse code: Invalid JSON format")
        except ValueError as e:
            logger.error(f"Error validating code format: {str(e)}")
            raise ValueError(f"Failed to parse code: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error generating code: {str(e)}")
        raise Exception(f"Failed to generate code: {str(e)}")

async def analyze_code(code: str, task_description: str, language: str, has_errors: bool = False) -> str:
    """
    Analyze the user's code and provide feedback:
    - If code is correct: Provide alternative approaches or success messages
    - If code has errors: Provide abstract hints without directly revealing errors or solutions
    """
    if not model:
        try:
            initialize_gemini()
        except Exception as e:
            raise Exception("Failed to initialize Gemini API. Please check your API key.")

    try:
        # Use different prompts based on whether the code has errors
        if has_errors:
            prompt = f"""Analyze the following {language} code for the task:
            
            Task: {task_description}
            
            Code:
            ```{language}
            {code}
            ```
            
            Important instructions:
            1. The code has errors or isn't working correctly
            2. DO NOT directly solve the problem - your goal is to coach, not solve
            3. DO NOT provide code snippets or direct solutions
            4. DO NOT tell the user exactly what's wrong (no line numbers or exact error messages)
            5. DO provide abstract hints that guide them to discover the issue themselves
            6. Focus on conceptual understanding, not specific syntax fixes
            7. Give 2-3 graduated hints that become progressively more specific
            8. Use a supportive, encouraging tone
            9. Keep your response CONCISE - use short paragraphs and bullet points
            10. DO NOT reveal the complete solution or approach
            
            Example good hints:
            - "Consider how your algorithm handles empty inputs"
            - "Check your logic for handling boundary conditions"
            - "Think about the initialization of your variables"
            
            Example bad hints (don't do these):
            - "Change line 10 to fix the null reference" (too specific)
            - "You should use a for loop instead of while" (direct solution)
            - "Your code throws an IndexOutOfBoundsException" (exact error)
            
            Format your response as a clear, concise list of hints that progressively guide the user.
            """
        else:
            prompt = f"""Analyze the following {language} code for the task:
            
            Task: {task_description}
            
            Code:
            ```{language}
            {code}
            ```
            
            Important instructions:
            1. First, determine if the code is correct and complete for the given task
            2. If code is CORRECT:
               a. Start with a brief success message
               b. Analyze the time and space complexity
               c. Suggest 1-2 alternative approaches that might be more efficient or elegant
            3. If code seems INCOMPLETE or INCORRECT:
               a. DO NOT provide direct corrections or solutions
               b. Provide 2-3 abstract hints that guide the user to discover issues themselves
               c. Be supportive and encouraging
            4. Keep your response CONCISE - use short paragraphs and bullet points
            5. DO NOT provide complete code rewrites or direct solutions in any case
            6. DO NOT include any code snippets or specific syntax fixes
            7. Use plain text only - no special formatting, markdown, or characters that might cause rendering issues
            
            Format your response as clear, concise sections with bullet points where appropriate.
            """

        response = await model.generate_content_async(prompt)
        
        if not response or not response.text:
            raise ValueError("No response from AI model")
        
        # Clean the response to avoid potential React rendering issues
        clean_response = response.text.strip()
        
        # Additional safety measures to prevent rendering issues
        # Remove any potential JSX-like content or objects that could cause React errors
        clean_response = clean_response.replace("<", "&lt;").replace(">", "&gt;")
        
        return clean_response
    
    except Exception as e:
        logger.error(f"Error analyzing code: {str(e)}")
        return f"Unable to analyze code: {str(e)}" 