import json
import re
import logging
from typing import Dict, Any, List, Optional

# Configure logging
logger = logging.getLogger(__name__)

def extract_json_from_response(text: str) -> Dict[str, Any]:
    """Extract JSON from a response that might be wrapped in markdown code blocks."""
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

def generate_quiz_verification(answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Verify user's quiz answers and calculate score"""
    correct_answers = 0
    total_questions = len(answers)
    
    # This will store feedback for each question
    question_feedback = []
    
    # Check each answer
    for answer in answers:
        question_id = answer.get('question_id')
        user_answer = answer.get('answer')
        correct_answer = answer.get('correct_answer')
        
        # Basic validation
        if user_answer is None or correct_answer is None:
            question_feedback.append({
                "question_id": question_id,
                "correct": False,
                "feedback": "Invalid answer format"
            })
            continue
        
        # Check if answer is correct (case-insensitive string comparison)
        is_correct = False
        if isinstance(user_answer, str) and isinstance(correct_answer, str):
            is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
        else:
            is_correct = user_answer == correct_answer
        
        if is_correct:
            correct_answers += 1
            question_feedback.append({
                "question_id": question_id,
                "correct": True,
                "feedback": "Correct answer!"
            })
        else:
            question_feedback.append({
                "question_id": question_id,
                "correct": False,
                "feedback": f"Incorrect. The correct answer is: {correct_answer}"
            })
    
    # Calculate score
    score = int((correct_answers / total_questions) * 100) if total_questions > 0 else 0
    
    # Determine if user passed (require all answers to be correct)
    passed = correct_answers == total_questions
    
    return {
        "correct": passed,
        "score": score,
        "feedback": "All answers correct!" if passed else "Some answers were incorrect. Please try again.",
        "question_feedback": question_feedback
    }

def format_step_title(step_number: int, title: str) -> str:
    """Format a step title to ensure it includes the step number"""
    # Remove any existing step number pattern from the title
    clean_title = re.sub(r'^Step\s+\d+:\s*', '', title)
    
    # Format with the correct step number
    return f"Step {step_number}: {clean_title}" 