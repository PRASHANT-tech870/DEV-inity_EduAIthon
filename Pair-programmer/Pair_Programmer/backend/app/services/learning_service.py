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

async def generate_learning_content(task_description: str, language: str, wrong_answers: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generate learning content based on the task description and wrong answers.
    """
    if not model:
        try:
            initialize_gemini()
        except Exception as e:
            raise Exception("Failed to initialize Gemini API. Please check your API key.")

    try:
        logger.info(f"Generating learning content for task: {task_description}")
        logger.info(f"Number of wrong answers: {len(wrong_answers) if wrong_answers else 0}")
        
        # Generate explanations for wrong answers
        wrong_answer_explanations = []
        concept_keywords_set = set()
        
        if wrong_answers:
            for wrong in wrong_answers:
                explanation_prompt = f"""For the following programming question in {language}:
                Question: {wrong['question']}
                {f"Code snippet: {wrong['code_snippet']}" if 'code_snippet' in wrong and wrong['code_snippet'] else ""}
                Correct answer: {wrong['correct_answer']}
                User's answer: {wrong['user_answer']}
                
                Provide a detailed explanation that includes:
                1. Why the correct answer is right (2-3 sentences)
                2. What the user might have misunderstood
                3. A visual explanation if the question involves:
                   - Code execution flow
                   - Data structures
                   - Algorithm steps
                   - Memory/stack operations
                   - Object relationships
                
                Format the response as JSON:
                {{
                    "explanation": "Main explanation text",
                    "visual_explanation": {{
                        "type": "flowchart|diagram|steps|memory|none",
                        "content": "ASCII art or text-based visualization if needed"
                    }},
                    "concept_keywords": ["keyword1", "keyword2", ...]  # Key concepts to focus on
                }}
                
                If no visual explanation is needed, set visual_explanation.type to "none" and content to empty string."""
                
                try:
                    response = await model.generate_content_async(explanation_prompt)
                    if response and response.text:
                        try:
                            # Clean the response text
                            clean_text = response.text.strip()
                            if clean_text.startswith("```json"):
                                clean_text = clean_text[7:]
                            if clean_text.endswith("```"):
                                clean_text = clean_text[:-3]
                            clean_text = clean_text.strip()
                            
                            explanation = json.loads(clean_text)
                            
                            # Ensure all fields exist
                            if "explanation" not in explanation:
                                explanation["explanation"] = "No explanation provided."
                            
                            if "visual_explanation" not in explanation:
                                explanation["visual_explanation"] = {"type": "none", "content": ""}
                            elif "type" not in explanation["visual_explanation"]:
                                explanation["visual_explanation"]["type"] = "none"
                            elif "content" not in explanation["visual_explanation"]:
                                explanation["visual_explanation"]["content"] = ""
                            
                            if "concept_keywords" not in explanation:
                                explanation["concept_keywords"] = []
                            
                            # Add to explanations list
                            wrong_answer_explanations.append(explanation)
                            
                            # Add keywords to set
                            if explanation["concept_keywords"]:
                                concept_keywords_set.update(explanation["concept_keywords"])
                                
                        except json.JSONDecodeError as e:
                            logger.error(f"Failed to parse explanation JSON: {response.text}")
                            logger.error(f"Error: {str(e)}")
                            # Add a default explanation
                            wrong_answer_explanations.append({
                                "explanation": "Sorry, we couldn't generate an explanation for this question.",
                                "visual_explanation": {"type": "none", "content": ""},
                                "concept_keywords": []
                            })
                except Exception as e:
                    logger.error(f"Error generating explanation: {str(e)}")
                    wrong_answer_explanations.append({
                        "explanation": "Sorry, we couldn't generate an explanation for this question.",
                        "visual_explanation": {"type": "none", "content": ""},
                        "concept_keywords": []
                    })

        # Generate general learning content
        prompt = f"""Generate comprehensive learning content for the following programming task in {language}:
        Task: {task_description}
        
        Requirements:
        1. Break down the content into clear sections:
           - Core Concepts
           - Implementation Approach
           - Best Practices
           - Common Pitfalls
           - Language-Specific Features
        2. Include code examples where relevant
        3. Provide detailed explanations
        4. Focus on practical understanding
        5. Return the content in the following JSON format:
        {{
            "sections": [
                {{
                    "title": "Section Title",
                    "content": "Detailed explanation...",
                    "code": "Optional code example..."
                }},
                ...
            ]
        }}
        
        Important: 
        - Return ONLY the JSON object, no other text, markdown formatting, or backticks
        - The 'code' field should be a string containing the code example
        - If no code example is needed for a section, omit the 'code' field entirely
        - Make sure the JSON is properly formatted and valid"""

        try:
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
            content = json.loads(response_text)
            
            # Validate the structure
            if not isinstance(content, dict):
                raise ValueError("Response is not a dictionary")
            
            if "sections" not in content:
                content["sections"] = []
            
            # Validate each section has the required fields
            for i, section in enumerate(content["sections"]):
                if "title" not in section:
                    section["title"] = f"Section {i+1}"
                if "content" not in section:
                    section["content"] = "No content provided."
                
                # Convert all fields to strings
                section["title"] = str(section["title"])
                section["content"] = str(section["content"])
                
                if "code" in section:
                    if section["code"] is None:
                        del section["code"]
                    else:
                        section["code"] = str(section["code"])
            
            # Add wrong answer explanations if available
            if wrong_answer_explanations:
                content["wrong_answers"] = wrong_answer_explanations
                
                # Add concept keywords
                content["concept_keywords"] = list(concept_keywords_set)
            else:
                content["wrong_answers"] = []
                content["concept_keywords"] = []
            
            # Add a flag to indicate that boilerplate code should be used
            content["use_boilerplate"] = True
            
            logger.info("Successfully generated learning content")
            return content
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing learning content JSON: {str(e)}")
            raise ValueError(f"Failed to parse learning content: Invalid JSON format - {str(e)}")
        except ValueError as e:
            logger.error(f"Error validating learning content format: {str(e)}")
            raise ValueError(f"Failed to parse learning content: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error generating learning content: {str(e)}")
        raise Exception(f"Failed to generate learning content: {str(e)}") 