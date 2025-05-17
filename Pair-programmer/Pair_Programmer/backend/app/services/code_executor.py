import aiohttp
import logging
from app.models.task import ProgrammingLanguage
import json

logger = logging.getLogger(__name__)

# Piston API configuration
PISTON_API_URL = "https://emkc.org/api/v2/piston/execute"

# Language mapping for Piston
LANGUAGE_MAPPING = {
    ProgrammingLanguage.PYTHON: "python",
    ProgrammingLanguage.JAVASCRIPT: "javascript",
    ProgrammingLanguage.JAVA: "java",
    ProgrammingLanguage.CPP: "cpp",
    ProgrammingLanguage.CSHARP: "csharp",
    ProgrammingLanguage.GO: "go",
    ProgrammingLanguage.RUST: "rust",
    ProgrammingLanguage.PHP: "php",
    ProgrammingLanguage.RUBY: "ruby",
    ProgrammingLanguage.SWIFT: "swift",
}

async def execute_code(code: str, language: ProgrammingLanguage) -> str:
    """
    Execute the given code using Piston API and return the output.
    """
    try:
        piston_language = LANGUAGE_MAPPING.get(language)
        if not piston_language:
            raise ValueError(f"Language {language} is not supported")

        # Prepare the execution request
        execution_data = {
            "language": piston_language,
            "version": "*",  # Use the latest version
            "files": [
                {
                    "name": f"main.{piston_language}",
                    "content": code
                }
            ],
            "stdin": "",  # You can add input here if needed
            "args": []
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                PISTON_API_URL,
                json=execution_data
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Failed to execute code: {error_text}")
                
                result = await response.json()
                
                if result.get("run"):
                    run_result = result["run"]
                    if run_result.get("stderr"):
                        return f"Error:\n{run_result['stderr']}"
                    return run_result.get("stdout", "No output")
                else:
                    return "Error: No execution result received"

    except Exception as e:
        logger.error(f"Error executing code: {str(e)}")
        raise Exception(f"Failed to execute code: {str(e)}") 