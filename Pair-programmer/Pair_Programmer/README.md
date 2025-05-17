# AI-Assisted Coding Platform

A full-stack application that provides real-time AI assistance for coding tasks, built with React.js and FastAPI.

## Project Structure

```
.
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React Context for state management
│   │   ├── services/       # API service functions
│   │   └── utils/          # Utility functions
│   └── package.json
│
└── backend/                 # FastAPI backend application
    ├── app/
    │   ├── api/            # API routes
    │   ├── core/           # Core functionality
    │   ├── models/         # Data models
    │   └── services/       # Business logic
    └── requirements.txt
```

## Setup Instructions

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Features
- Task selection with difficulty levels
- Real-time code editor with language support
- AI-assisted code generation and hints
- Smooth loading animations and UX enhancements
- State management across pages 