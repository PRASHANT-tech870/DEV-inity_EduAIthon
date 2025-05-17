import uvicorn
import sys
import os

# Add path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Starting AI-Guided Project Builder Backend...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 