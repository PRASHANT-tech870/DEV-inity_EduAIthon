import subprocess
import tempfile
import os
import uuid
import signal
import logging
import psutil
from typing import Dict, Optional

# Configure logging
logger = logging.getLogger(__name__)

class ExecutionService:
    def __init__(self):
        # Store running Streamlit processes keyed by execution_id
        self.streamlit_processes = {}
        
    def execute_code(self, code: str, language: str) -> Dict:
        """Execute code in the specified language"""
        execution_id = str(uuid.uuid4())
        
        if language == "python":
            return self.execute_python(code, execution_id)
        elif language == "javascript":
            return self.execute_javascript(code, execution_id)
        elif language == "html":
            return self.render_html(code, execution_id)
        elif language == "css":
            return self.render_css(code, execution_id)
        else:
            raise ValueError(f"Unsupported language: {language}")
    
    def execute_python(self, code: str, execution_id: str) -> Dict:
        """Execute Python code and return the result"""
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as temp_file:
            temp_file.write(code.encode())
            temp_file_path = temp_file.name
        
        try:
            # Check if this is a Streamlit app
            is_streamlit = 'import streamlit' in code or 'from streamlit' in code
            
            if is_streamlit:
                # Terminate any existing process with the same execution_id
                self.terminate_streamlit_process(execution_id)
                
                # Execute Streamlit with a timeout
                # We can't capture the web output, but we can report if it started successfully
                try:
                    # Start Streamlit process on a random port
                    port = 8501 + (hash(execution_id) % 100)  # Random port between 8501-8600
                    
                    # Build the command with appropriate flags to run headless
                    streamlit_cmd = [
                        "streamlit", "run", 
                        temp_file_path,
                        "--server.address", "localhost",
                        "--server.port", str(port),
                        "--server.headless", "true",
                        "--server.runOnSave", "true",
                        "--browser.serverAddress", "localhost",
                        "--browser.gatherUsageStats", "false"
                    ]
                    
                    # Use Popen instead of run so we don't block waiting for the process
                    process = subprocess.Popen(
                        streamlit_cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        start_new_session=True  # This detaches the process
                    )
                    
                    # Store the process for later cleanup
                    self.streamlit_processes[execution_id] = process
                    
                    # Wait a short time to see if the process starts up without errors
                    subprocess.run(["sleep", "2"])
                    
                    # Check if the process is still running
                    if process.poll() is None:
                        # Still running, assume success
                        return {
                            "stdout": "Streamlit app is running successfully at http://localhost:" + str(port),
                            "stderr": "",
                            "exit_code": 0,
                            "execution_id": execution_id,
                            "is_streamlit": True,
                            "streamlit_url": f"http://localhost:{port}",
                            "streamlit_port": port
                        }
                    else:
                        # Process ended quickly, likely an error
                        stdout, stderr = process.communicate(timeout=1)
                        # Remove from tracked processes
                        if execution_id in self.streamlit_processes:
                            del self.streamlit_processes[execution_id]
                        return {
                            "stdout": stdout,
                            "stderr": stderr,
                            "exit_code": process.returncode,
                            "execution_id": execution_id,
                            "is_streamlit": True,
                            "streamlit_error": True
                        }
                
                except subprocess.TimeoutExpired:
                    # Cleanup if process tracking was started
                    if execution_id in self.streamlit_processes:
                        self.terminate_streamlit_process(execution_id)
                    return {
                        "stdout": "",
                        "stderr": "Timeout while starting Streamlit app",
                        "exit_code": -1,
                        "execution_id": execution_id,
                        "is_streamlit": True,
                        "streamlit_error": True
                    }
                except Exception as e:
                    # Cleanup if process tracking was started
                    if execution_id in self.streamlit_processes:
                        self.terminate_streamlit_process(execution_id)
                    return {
                        "stdout": "",
                        "stderr": f"Error running Streamlit app: {str(e)}",
                        "exit_code": -1,
                        "execution_id": execution_id,
                        "is_streamlit": True,
                        "streamlit_error": True
                    }
            else:
                # For regular Python, run normally
                result = subprocess.run(
                    ["python3", temp_file_path],
                    capture_output=True,
                    text=True,
                    timeout=10  # Set a timeout to prevent infinite loops
                )
                return {
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "exit_code": result.returncode,
                    "execution_id": execution_id,
                    "is_streamlit": False
                }
        except subprocess.TimeoutExpired:
            # Cleanup if process tracking was started for Streamlit
            if 'is_streamlit' in locals() and is_streamlit and execution_id in self.streamlit_processes:
                self.terminate_streamlit_process(execution_id)
            return {
                "stdout": "",
                "stderr": "Execution timed out",
                "exit_code": -1,
                "execution_id": execution_id,
                "is_streamlit": is_streamlit if 'is_streamlit' in locals() else False
            }
        finally:
            # Don't delete the file immediately as the Streamlit process might still be using it
            # We could implement a cleanup mechanism later
            if not 'is_streamlit' in locals() or not is_streamlit:
                os.unlink(temp_file_path)
    
    def execute_javascript(self, code: str, execution_id: str) -> Dict:
        """Execute JavaScript code using Node.js"""
        with tempfile.NamedTemporaryFile(suffix=".js", delete=False) as temp_file:
            temp_file.write(code.encode())
            temp_file_path = temp_file.name
        
        try:
            result = subprocess.run(
                ["node", temp_file_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
                "execution_id": execution_id
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timed out",
                "exit_code": -1,
                "execution_id": execution_id
            }
        finally:
            os.unlink(temp_file_path)
    
    def render_html(self, html_code: str, execution_id: str) -> Dict:
        """Return HTML code for frontend to render"""
        return {
            "stdout": "",
            "stderr": "",
            "exit_code": 0,
            "execution_id": execution_id,
            "html_content": html_code
        }
    
    def render_css(self, css_code: str, execution_id: str) -> Dict:
        """Return CSS code for frontend to use with HTML"""
        return {
            "stdout": "",
            "stderr": "",
            "exit_code": 0,
            "execution_id": execution_id,
            "css_content": css_code
        }
    
    def render_website(self, html_code: str, css_code: str) -> Dict:
        """Combine HTML and CSS for rendering"""
        # Create a temporary HTML file with the CSS embedded
        temp_dir = tempfile.mkdtemp()
        html_file_path = os.path.join(temp_dir, "index.html")
        
        # Combine HTML and CSS
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
            {css_code}
            </style>
        </head>
        <body>
        {html_code}
        </body>
        </html>
        """
        
        with open(html_file_path, "w") as html_file:
            html_file.write(full_html)
        
        # Return the combined HTML
        return {
            "rendered_html": full_html,
            "status": "success"
        }
    
    def terminate_streamlit_process(self, execution_id: str) -> bool:
        """Terminate a Streamlit process by execution_id"""
        if execution_id in self.streamlit_processes:
            process = self.streamlit_processes[execution_id]
            if process.poll() is None:  # Process is still running
                try:
                    # Try to terminate process group to ensure all child processes are killed
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                except (ProcessLookupError, PermissionError):
                    # Fallback to just terminating the process
                    process.terminate()
                    
                # Wait a bit for process to terminate
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    # Force kill if it doesn't terminate
                    try:
                        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                    except (ProcessLookupError, PermissionError):
                        process.kill()
            
            # Remove from tracked processes
            del self.streamlit_processes[execution_id]
            return True
        return False 