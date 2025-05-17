import os
import google.generativeai as genai
from dotenv import load_dotenv
import logging
import json
from typing import List, Dict, Any

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

async def generate_quiz(task_description: str, language: str) -> List[Dict[str, Any]]:
    """
    Generate a quiz with 10 questions about the task and its implementation.
    """
    if not model:
        try:
            initialize_gemini()
        except Exception as e:
            raise Exception("Failed to initialize Gemini API. Please check your API key.")

    try:
        prompt = f"""Generate a quiz with 10 multiple-choice questions about the following programming task in {language}:
        Task: {task_description}
        
        Requirements:
        1. Questions should test understanding of:
           - Core concepts related to the task
           - Implementation details
           - Best practices
           - Common pitfalls
           - Language-specific features
        2. Each question should have 4 options
        3. Include one correct answer per question
        4. Questions should be challenging but fair
        5. Include at least 3 questions with code snippets that test understanding of code execution
        6. Return the questions in the following JSON format:
        [
            {{
                "id": "q1",
                "question": "Question text",
                "code_snippet": "Optional code snippet to analyze",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A"
            }},
            ...
        ]
        
        Important: 
        - Return ONLY the JSON array, no other text, markdown formatting, or backticks
        - For questions with code snippets, make sure the options are about what the code will do or output
        - For questions without code snippets, focus on conceptual understanding
        - The code_snippet field should be omitted for non-code questions"""

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
            questions = json.loads(response_text)
            if not isinstance(questions, list):
                raise ValueError("Response is not a list")
            if len(questions) != 10:
                raise ValueError(f"Expected 10 questions, got {len(questions)}")
            
            # Validate each question has the required fields
            for i, question in enumerate(questions):
                if not all(key in question for key in ['id', 'question', 'options', 'correct_answer']):
                    raise ValueError(f"Question {i+1} is missing required fields")
                if not isinstance(question['options'], list) or len(question['options']) != 4:
                    raise ValueError(f"Question {i+1} must have exactly 4 options")
                if question['correct_answer'] not in question['options']:
                    raise ValueError(f"Question {i+1} correct answer must be one of the options")
                
                # Validate code_snippet if present
                if 'code_snippet' in question and question['code_snippet'] is not None:
                    if not isinstance(question['code_snippet'], str):
                        raise ValueError(f"Question {i+1} code_snippet must be a string")
            
            return questions
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing quiz JSON: {str(e)}")
            logger.error(f"Raw response: {response_text}")
            raise ValueError("Failed to parse quiz questions: Invalid JSON format")
        except ValueError as e:
            logger.error(f"Error validating quiz format: {str(e)}")
            raise ValueError(f"Failed to parse quiz questions: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise Exception(f"Failed to generate quiz: {str(e)}")

async def check_quiz_answers(questions: List[Dict[str, Any]], answers: Dict[str, str]) -> Dict[str, Any]:
    """
    Check the quiz answers against the provided questions.
    
    Args:
        questions: List of question objects with correct answers
        answers: Dictionary mapping question IDs to user answers
        
    Returns:
        Dictionary with score and other evaluation data
    """
    try:
        # Create a map of question IDs to questions for easier lookup
        question_map = {q["id"]: q for q in questions}
        
        # Check answers
        score = 0
        wrong_answers = []
        correct_answers = []
        question_results = []
        
        logger.info(f"Checking answers: {answers}")
        logger.info(f"Available questions: {[q['id'] for q in questions]}")
        
        for question_id, user_answer in answers.items():
            if question_id in question_map:
                question = question_map[question_id]
                correct_answer = question["correct_answer"]
                
                # Compare answers case-insensitively and ignoring extra whitespace
                is_correct = False

                # First try to handle numeric values correctly
                user_answer_text = user_answer.strip()
                correct_answer_text = correct_answer.strip()
                
                # Check if both answers are numeric
                try:
                    # If both are valid integers, compare them as numbers
                    if user_answer_text.isdigit() and correct_answer_text.isdigit():
                        is_correct = int(user_answer_text) == int(correct_answer_text)
                    # If both are valid floats, compare them as numbers
                    elif (user_answer_text.replace('.', '', 1).isdigit() and 
                          correct_answer_text.replace('.', '', 1).isdigit()):
                        is_correct = float(user_answer_text) == float(correct_answer_text)
                    else:
                        # Fall back to case-insensitive string comparison for non-numeric values
                        is_correct = user_answer_text.lower() == correct_answer_text.lower()
                except (ValueError, TypeError):
                    # Fall back to case-insensitive string comparison if conversion fails
                    is_correct = user_answer_text.lower() == correct_answer_text.lower()
                
                # Add to question results
                question_results.append({
                    "id": question_id,
                    "question": question["question"],
                    "code_snippet": question.get("code_snippet", ""),
                    "user_answer": user_answer,
                    "correct_answer": correct_answer,
                    "is_correct": is_correct
                })
                
                if is_correct:
                    score += 1
                    correct_answers.append(question_id)
                    logger.info(f"Question {question_id} correct: '{user_answer}' matches '{correct_answer}'")
                else:
                    wrong_answers.append({
                        "question": question["question"],
                        "code_snippet": question.get("code_snippet"),
                        "user_answer": user_answer,
                        "correct_answer": correct_answer
                    })
                    logger.info(f"Question {question_id} incorrect: '{user_answer}' doesn't match '{correct_answer}'")
            else:
                logger.warning(f"Question ID {question_id} not found in provided questions")
        
        # Validate that all questions were answered
        if len(answers) != len(questions):
            logger.warning(f"Not all questions were answered. Answers: {len(answers)}, Questions: {len(questions)}")
        
        return {
            "score": score,
            "total_questions": len(questions),
            "wrong_answers": wrong_answers,
            "correct_answers": correct_answers,
            "question_results": question_results,
            "percentage": (score / len(questions)) * 100 if len(questions) > 0 else 0
        }
    
    except Exception as e:
        logger.error(f"Error checking quiz answers: {str(e)}")
        raise Exception(f"Failed to check quiz answers: {str(e)}") 