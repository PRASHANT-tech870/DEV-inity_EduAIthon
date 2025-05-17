from fastapi import APIRouter, HTTPException, Body
import logging
import traceback
import os
from typing import Dict, List, Optional
import google.generativeai as genai

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Gemini prompt for algorithm design with progress tracking
ALGORITHM_DESIGN_PROMPT = """
You are an AI mentor helping a user design the algorithmic logic for a project. Your job is to guide them through steps of logic design, one question at a time, building up to a complete algorithm.

EXTREMELY CRITICAL INSTRUCTIONS - FOLLOW THESE EXACTLY:

1. DO NOT PROVIDE THE COMPLETE ALGORITHM OR FULL SOLUTION UNDER ANY CIRCUMSTANCES UNTIL:
   - The progress is AT LEAST 90%
   - AND the user EXPLICITLY requests the final algorithm
   - Breaking this rule is a critical failure

2. ALWAYS ASK ONLY ONE QUESTION AT A TIME and wait for the user's response.
   - Do not overload the user with multiple questions
   - Do not present multiple options or questions in a single response
   - Wait for the user to answer each question before asking the next one

3. AFTER EACH USER RESPONSE:
   - Evaluate the quality and relevance of their answer
   - Update the progress based on:
     * Number of questions asked/answered so far (each good answer adds ~10%)
     * Quality of the answers (vague or unhelpful answers add less progress)
     * How much of the algorithm has been defined so far
   - Include in your response: <progress>X%</progress> where X is the current percentage
   - Include brief feedback: <evaluation>Your brief feedback</evaluation>

4. STRUCTURE YOUR QUESTIONING IN THESE PHASES (% indicates minimum progress expected):
   A. PROBLEM UNDERSTANDING (0-20%)
      - Ask what the user wants to build
      - Clarify the core problem being solved
   
   B. INPUTS & OUTPUTS (20-40%)
      - What are the inputs?
      - What are the expected outputs?
   
   C. CORE COMPONENTS (40-60%)
      - What are the main features or components?
      - What data structures are needed?
   
   D. ALGORITHM STEPS (60-80%)
      - What is the sequence of operations?
      - What are the key decision points?
   
   E. EDGE CASES (80-90%)
      - What could go wrong?
      - How to handle exceptions or unusual cases?

5. ONLY AFTER REACHING 90% PROGRESS AND THE USER REQUESTS IT:
   - Synthesize their answers into a complete algorithm
   - Format as a numbered list with clear steps
   - End with the exact text: "WORKFLOW_COMPLETE"

6. CRITICAL: ENSURE EACH RESPONSE FOLLOWS THIS EXACT TEMPLATE:
   <progress>X%</progress>
   <evaluation>Brief feedback on their answer</evaluation>
   
   [Your response text with only ONE question]

7. NEVER SKIP AHEAD - the goal is to make the user think through each step. Even if they seem experienced, guide them through the full process.

Start by introducing yourself briefly, then immediately ask your FIRST QUESTION about what the user wants to build. Remember to include the required progress and evaluation tags.
"""

def get_api_key():
    """Get the Google API key from environment or app config"""
    from app import get_google_api_key
    return get_google_api_key()

@router.post("/algorithm_designer")
async def algorithm_designer_chat(request: Dict = Body(...)):
    """
    Process a message from the algorithm designer chat interface.
    
    This endpoint handles interactions with the algorithm designer tool,
    which helps users design algorithms before coding.
    
    The request should contain:
    - project_description: A description of the project (only needed for first message)
    - message: The user's latest message
    - conversation_history: List of previous messages in the conversation
    - request_final: Boolean indicating if user is requesting the final flowchart
    - boost_progress: Boolean indicating if progress should be boosted due to stalling
    - exchange_count: Integer indicating the number of exchanges so far
    """
    
    try:
        # Log the incoming request for debugging
        logger.debug(f"Received algorithm designer request")
        
        message = request.get('message', '')
        conversation_history = request.get('conversation_history', [])
        project_description = request.get('project_description', '')
        request_final = request.get('request_final', False)
        boost_progress = request.get('boost_progress', False)
        exchange_count = request.get('exchange_count', 0)
        
        # Get API key
        api_key = get_api_key()
        
        # Initialize Gemini
        genai.configure(api_key=api_key)
        
        # For simple test requests
        if message == 'test':
            return {
                "response": "<progress>15%</progress>\n<evaluation>This is a test response</evaluation>\nThis is a test response from the Algorithm Designer. I'm working properly!",
                "progress": 15
            }
            
        # Extract current progress from conversation history if available
        current_progress = 0
        for msg in conversation_history:
            if msg['role'] == 'assistant':
                progress_tag = "<progress>"
                if progress_tag in msg['content']:
                    try:
                        start_idx = msg['content'].find(progress_tag) + len(progress_tag)
                        end_idx = msg['content'].find("%</progress>")
                        if end_idx > start_idx:
                            current_progress = int(msg['content'][start_idx:end_idx])
                    except:
                        pass
        
        # ACCELERATED PROGRESS: Increase progress based on exchange count to complete in 7-8 exchanges
        # Calculate minimum progress based on number of exchanges (should reach 90% after 7-8 exchanges)
        min_progress_by_exchange = {
            0: 0,  # Initial state
            1: 15, # First exchange (user's initial description)
            2: 30, # Second exchange
            3: 45, # Third exchange
            4: 60, # Fourth exchange
            5: 70, # Fifth exchange
            6: 80, # Sixth exchange
            7: 90, # Seventh exchange - ready for final algorithm
            8: 95, # Eighth exchange - definitely ready for final
        }
        
        # Get the minimum progress for the current exchange count
        min_expected_progress = min_progress_by_exchange.get(exchange_count, 95)  # Default to 95% for higher counts
        
        # If actual progress is less than expected minimum, boost it
        if current_progress < min_expected_progress:
            current_progress = min_expected_progress
            logger.debug(f"Boosting progress to {current_progress}% based on exchange count {exchange_count}")
        
        # Check if user is explicitly requesting final algorithm
        requesting_final = False
        final_keywords = ["final", "complete", "finish", "flowchart", "algorithm", "workflow", "done"]
        
        # AUTOMATICALLY TRIGGER FINAL after 7+ exchanges or if explicitly requested
        if request_final or exchange_count >= 7 or (current_progress >= 85 and any(keyword in message.lower() for keyword in final_keywords)):
            requesting_final = True
            # Ensure progress is sufficient for final algorithm
            if current_progress < 90:
                current_progress = 90
        
        # If requesting final flowchart and progress is sufficient (>= 90%)
        if requesting_final and current_progress >= 90:
            # Add special instruction for final algorithm generation
            special_instruction = """
            Please generate the complete algorithmic workflow now.
            
            1. Create a well-structured, numbered list showing all steps of the algorithm
            2. Include clear headings for different sections
            3. Format using proper markdown for clarity
            4. Add the exact text "WORKFLOW_COMPLETE" at the very end
            
            DO NOT ask any more questions - this is the final output.
            """
            
            # Special system message for final algorithm generation
            formatted_history = []
            for msg in conversation_history:
                role = "user" if msg['role'] == 'user' else "model"
                formatted_history.append({"role": role, "parts": [msg['content']]})
            
            # Add our special instruction
            formatted_history.append({
                "role": "user",
                "parts": [f"{message}\n\n{special_instruction}\nPlease provide the complete final algorithm now."]
            })
            
            # Generate response with special instruction
            model = genai.GenerativeModel("gemini-1.5-flash", 
                generation_config={"temperature": 0.7, "top_p": 0.9, "max_output_tokens": 4000})
            chat = model.start_chat(history=formatted_history[:-1])  # Don't include our special instruction in history
            response = chat.send_message(formatted_history[-1]["parts"][0])
            
            # Format the response with 100% progress
            response_text = f"<progress>100%</progress>\n<evaluation>Final algorithm complete!</evaluation>\n\n{response.text}"
            if "WORKFLOW_COMPLETE" not in response.text:
                response_text += "\n\nWORKFLOW_COMPLETE"
                
            return {
                "response": response_text,
                "progress": 100
            }
        
        # For normal conversation flow
        else:
            # Format the conversation history for Gemini
            formatted_history = []
            for msg in conversation_history:
                role = "user" if msg['role'] == 'user' else "model"
                formatted_history.append({"role": role, "parts": [msg['content']]})
                
            # Add the system prompt if this is a new conversation
            if len(formatted_history) <= 1:  # Only assistant welcome message
                formatted_history = [{
                    "role": "model",
                    "parts": [ALGORITHM_DESIGN_PROMPT]
                }] + formatted_history
            
            # Add the new message from the user
            formatted_history.append({
                "role": "user", 
                "parts": [message]
            })
            
            # ACCELERATED PROGRESS INSTRUCTION: Tell the AI to move faster through the process
            progress_instruction = f"""
            IMPORTANT: Please accelerate the algorithm design process.
            
            Current exchange: {exchange_count}
            Current progress: {current_progress}%
            Target progress: {min_expected_progress}%
            
            Please:
            1. Ask a focused question that moves the design forward significantly
            2. Set the progress to at least {min_expected_progress}%
            3. If this is exchange 6+, prepare to move toward the final algorithm
            4. Keep your response concise and focused
            
            We need to reach 90%+ progress within 7-8 exchanges total.
            """
            
            # Add the progress instruction
            formatted_history.append({
                "role": "user",
                "parts": [progress_instruction]
            })
            
            logger.debug(f"Sending to Gemini API with history length: {len(formatted_history)}")
            
            # Generate response from Gemini
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            # Don't include our acceleration instruction in the history
            chat_history = formatted_history[:-1]
            chat = model.start_chat(history=chat_history[:-1])  # Don't include the last user message in history
            
            # Use the last message that includes our instructions
            response = chat.send_message(formatted_history[-1]["parts"][0])
            
            logger.debug("Successfully received response from Gemini API")
            
            # Extract progress from response if available
            progress = current_progress
            response_text = response.text
            progress_tag = "<progress>"
            if progress_tag in response_text:
                try:
                    start_idx = response_text.find(progress_tag) + len(progress_tag)
                    end_idx = response_text.find("%</progress>")
                    if end_idx > start_idx:
                        progress = int(response_text[start_idx:end_idx])
                except:
                    pass
            
            # FORCE PROGRESS: Ensure progress meets or exceeds the expected minimum
            if progress < min_expected_progress:
                progress = min_expected_progress
                
                # Update progress tag in response if present
                if progress_tag in response_text:
                    response_text = response_text.replace(
                        f"<progress>{response_text[start_idx:end_idx]}%</progress>",
                        f"<progress>{progress}%</progress>"
                    )
            
            return {
                "response": response_text,
                "progress": progress
            }
        
    except Exception as e:
        error_detail = f"Error in algorithm designer: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_detail)
        # Return a more helpful error response
        return {
            "response": f"I'm sorry, there was an error processing your request: {str(e)}. Please try again later.",
            "error": str(e),
            "progress": 0
        } 