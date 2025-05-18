# EduAIthon - AI-Powered Coding Education Platform

A comprehensive educational platform that combines interactive code editing, intelligent algorithm design, and real-time website building with personalized AI guidance to help users develop programming skills from beginner to expert level.

## Core Features

### 1. Code Editor and Website Builder

#### Professional Code Editing Environment
- **Monaco Editor Integration** - Enterprise-grade code editing experience with:
  - Real-time syntax highlighting for multiple languages
  - Intelligent code completion with contextual suggestions
  - Error detection and inline diagnostics
  - Code folding and bracket matching
  - Multiple cursor support and keyboard shortcuts
  - Search and replace with regex support

#### Multi-language Development Support
- **HTML/CSS/JavaScript** - Complete web development environment:
  - HTML structural editing with tag completion
  - CSS styling with property suggestions
  - JavaScript functionality with syntax validation
  - Browser compatibility checks
  - DOM manipulation and event handling

- **Python** - Full-featured Python development:
  - Python 3.x syntax support
  - Library import suggestions
  - Function and class definitions
  - Runtime execution in sandboxed environment
  - Output capture and display
  - Integration with Streamlit for data applications

#### Real-time Preview and Rendering
- **Live Website Preview** - Instantly visualize your web projects:
  - DOM rendering of HTML structure
  - CSS styling application
  - JavaScript execution
  - Real-time updates as you type
  - Mobile and desktop viewport simulation

- **Split-screen Interface** - Dual-panel layout for efficient development:
  - Side-by-side code and preview
  - Adjustable panel sizes
  - Synchronized scrolling
  - Multi-file editing with tabbed interface

#### Comprehensive Output Visualization
- **Multi-tab Output Display** - Organized views for different output types:
  - Website Preview - Visual rendering of HTML/CSS/JS
  - Console Output - JavaScript console.log and Python print statements
  - Network Tab - HTTP requests and responses
  - Error Log - Compilation and runtime errors with line references
  - Source Code - Raw source code view for debugging

- **Responsive Design Testing** - Test websites across different device sizes:
  - Multiple viewport presets (phone, tablet, desktop)
  - Custom viewport dimension settings
  - Device pixel ratio simulation
  - Orientation switching (portrait/landscape)

### 2. Algorithm Designer

#### Interactive Algorithm Development Process
- **Step-by-Step AI Interview Process** - Guided algorithm design:
  - AI asks focused questions one at a time
  - Each question builds on previous answers
  - Personalized questions based on project complexity
  - Automatically adapts to user expertise level
  - Prevents overwhelming with multiple questions at once

- **Intelligent Conversation Flow** - Natural dialogue-based development:
  - Contextual follow-up questions
  - Clarification requests when needed
  - Response evaluation with personalized feedback
  - Suggestions for improvement
  - Concept explanations when knowledge gaps detected

#### Visual Progress Tracking
- **Detailed Progress Visualization** - See your algorithm development unfold:
  - Percentage-based progress indicator (0-100%)
  - Color-coded progress bar with animation
  - Current phase indicator showing design stage
  - Visual milestone markers at key development points:
    * Problem Understanding (0-15%)
    * Inputs & Outputs (15-30%)
    * Core Components (30-45%)
    * Algorithm Steps (45-60%)
    * Process Flow (60-75%)
    * Edge Cases (75-90%)
    * Final Algorithm (90-100%)

- **Accelerated Development Process** - Efficient algorithm creation:
  - Complete algorithm designs in 7-8 exchanges
  - Predefined progress schedule ensuring steady advancement
  - Automatic progress boost for stalled conversations
  - Exchange-count tracking to maintain forward momentum
  - Automatic final algorithm generation when ready

#### Algorithm Output and Export
- **Comprehensive Algorithm Documentation** - Complete, usable results:
  - Well-structured algorithmic workflow
  - Numbered steps with clear logic
  - Markdown formatting for readability
  - Section headings for organization
  - Input/output specifications
  - Edge case handling instructions
  - Implementation guidance

- **Multiple Export Options** - Take your algorithm anywhere:
  - Markdown file download for documentation
  - Clipboard copy for easy transfer to other tools
  - Seamless integration with code editor
  - Reference during implementation phase

#### Intelligent Feedback and Assistance
- **Personalized Evaluation** - Get feedback on your design choices:
  - Quality assessment of each response
  - Relevance evaluation for your project
  - Suggestions for improvement
  - Focus maintenance on core algorithm needs
  - Technical guidance calibrated to expertise level

- **Progress Management** - Smart handling of the development process:
  - Automatic detection of stalled progress
  - Simplification suggestions when stuck
  - Auto-triggering of final algorithm at appropriate time
  - Input field disabling after completion
  - Clear milestone indications of completed phases

### 3. AI-Guided Learning

#### Personalized Learning Experience
- **Expertise Level Customization** - Content tailored to your knowledge:
  - Beginner - Foundational concepts with detailed explanations
  - Intermediate - More advanced techniques with some guidance
  - Expert - Complex implementations with minimal handholding
  - Adaptive difficulty progression as skills improve

- **Project-Based Learning Approach** - Learn by building real projects:
  - Complete project suggestions based on selected technology
  - Step-by-step guided development
  - Progressive complexity introduction
  - Practical application of concepts
  - Portfolio-worthy final results

#### Real-time Feedback and Assistance
- **Intelligent Code Feedback** - Get help as you code:
  - Syntax and logical error identification
  - Improvement suggestions for code quality
  - Performance optimization tips
  - Security vulnerability detection
  - Readability recommendations

- **Adaptive Hint System** - Assistance based on your progress:
  - Initial attempts receive subtle hints
  - Continued struggles get more specific guidance
  - Multiple failed attempts receive detailed solutions
  - Custom guidance based on error patterns
  - Context-aware suggestions

#### Knowledge Assessment and Reinforcement
- **Step Completion Verification** - Ensure understanding before moving on:
  - Multiple-choice questions about completed steps
  - Knowledge application questions
  - Concept comprehension checks
  - Automatic generation of relevant questions
  - Performance-based advancement

- **Learning Analytics** - Track your educational progress:
  - Step completion rates
  - Code execution attempts
  - Error frequency and patterns
  - Question response accuracy
  - Overall project progress

## API Endpoints Reference

### Website Building and Code Execution

#### `/api/execute` (POST)
Execute code in a specified programming language

**Request Parameters:**
- `code` (string, required): The source code to execute
- `language` (string, required): Programming language (python, javascript)
- `session_id` (string, optional): Identifier for tracking user session

**Response:**
- `output` (string): Standard output from code execution
- `error` (string): Error message if execution failed
- `execution_time` (number): Time taken to execute in milliseconds
- `memory_usage` (number): Memory used during execution in MB

**Example:**
```json
// Request
{
  "code": "print('Hello, World!')",
  "language": "python",
  "session_id": "abcd1234"
}

// Response
{
  "output": "Hello, World!",
  "error": "",
  "execution_time": 5.23,
  "memory_usage": 10.5
}
```

#### `/api/render_website` (POST)
Combine HTML and CSS for rendering a webpage

**Request Parameters:**
- `html_code` (string, required): HTML source code
- `css_code` (string, required): CSS styles to apply
- `session_id` (string, optional): Session identifier for tracking

**Response:**
- `rendered_content` (string): Combined HTML and CSS content
- `preview_url` (string): URL to view the rendered page

**Example:**
```json
// Request
{
  "html_code": "<div>Hello World</div>",
  "css_code": "div { color: blue; }",
  "session_id": "abcd1234"
}

// Response
{
  "rendered_content": "<html><head><style>div { color: blue; }</style></head><body><div>Hello World</div></body></html>",
  "preview_url": "/preview/abcd1234"
}
```

### Algorithm Designer

#### `/api/algorithm_designer` (POST)
Process messages from the algorithm designer chat interface

**Request Parameters:**
- `project_description` (string, optional): Description of the project (needed for first message)
- `message` (string, required): User's latest message
- `conversation_history` (array, required): List of previous messages in the conversation
- `request_final` (boolean, optional): Flag indicating if user is requesting the final flowchart
- `boost_progress` (boolean, optional): Flag indicating if progress should be boosted due to stalling
- `exchange_count` (integer, optional): Number of exchanges so far

**Response:**
- `response` (string): AI's response message with progress tags
- `progress` (integer): Current progress percentage (0-100)
- `error` (string, optional): Error message if request failed

**Example:**
```json
// Request
{
  "project_description": "Todo list application",
  "message": "I want to build a task management system",
  "conversation_history": [
    {"role": "assistant", "content": "Welcome to the Algorithm Designer!"},
    {"role": "user", "content": "I need help designing a todo app"}
  ],
  "request_final": false,
  "exchange_count": 1
}

// Response
{
  "response": "<progress>15%</progress>\n<evaluation>Good start with your project idea</evaluation>\nWhat specific features do you want in your todo list application?",
  "progress": 15
}
```

### Project Management

#### `/api/start_project` (POST)
Start a new project based on user specifications

**Request Parameters:**
- `project_type` (string, required): Type of project (html+css+js, python+streamlit)
- `expertise_level` (string, required): User's expertise level (beginner, intermediate, expert)
- `project_idea` (string, optional): User's project idea or description

**Response:**
- `session_id` (string): Unique identifier for the project session
- `response` (string): JSON string containing project structure and steps

**Example:**
```json
// Request
{
  "project_type": "html+css+js",
  "expertise_level": "beginner",
  "project_idea": "Personal portfolio website"
}

// Response
{
  "session_id": "session_12345",
  "response": "{\"title\":\"Personal Portfolio Website\",\"description\":\"A responsive portfolio to showcase your work\",\"steps\":[...],\"total_steps\":8}"
}
```

#### `/api/next_step` (POST)
Get the next step of a project

**Request Parameters:**
- `session_id` (string, required): Project session identifier
- `current_step` (integer, required): Current step number
- `user_code` (string, required): Code written by the user in the current step
- `user_question` (string, optional): Any question the user has about the next step
- `user_understanding` (string, optional): User's self-reported understanding of the current step

**Response:**
- `session_id` (string): Project session identifier
- `response` (string): JSON string containing next step details

**Example:**
```json
// Request
{
  "session_id": "session_12345",
  "current_step": 0,
  "user_code": "<div>My portfolio</div>",
  "user_question": "How do I add styles?"
}

// Response
{
  "session_id": "session_12345",
  "response": "{\"step_number\":1,\"title\":\"Step 1: Adding Basic Styles\",\"description\":\"Now let's add some CSS to style your portfolio\",\"code_snippet\":\"/* Add your CSS here */\",\"expected_output\":\"A styled heading and section\",\"language\":\"css\"}"
}
```

#### `/api/get_step_questions` (POST)
Generate quiz questions for the current step

**Request Parameters:**
- `session_id` (string, required): Project session identifier
- `step_number` (integer, required): Current step number

**Response:**
- `questions` (array): List of quiz questions with multiple-choice options

**Example:**
```json
// Request
{
  "session_id": "session_12345",
  "step_number": 1
}

// Response
{
  "questions": [
    {
      "question": "What CSS property changes text color?",
      "options": ["color", "text-color", "font-color", "text-style"],
      "correctAnswer": "color"
    },
    {
      "question": "How do you select an element with id 'header' in CSS?",
      "options": ["#header", ".header", "header", "*header"],
      "correctAnswer": "#header"
    }
  ]
}
```

### Learning Support

#### `/api/verify_step_completion` (POST)
Verify user's understanding of a completed step using multiple choice questions

**Request Parameters:**
- `session_id` (string, required): Project session identifier
- `step_number` (integer, required): Step number being verified
- `user_answers` (array, required): User's answers to quiz questions

**Response:**
- `correct_count` (integer): Number of correctly answered questions
- `total_questions` (integer): Total number of questions
- `passing_score` (integer): Minimum score needed to proceed
- `passed` (boolean): Whether user passed the verification
- `feedback` (string): Feedback on user's answers

**Example:**
```json
// Request
{
  "session_id": "session_12345",
  "step_number": 1,
  "user_answers": [
    {"question_id": 1, "selected_answer": "color"},
    {"question_id": 2, "selected_answer": "#header"}
  ]
}

// Response
{
  "correct_count": 2,
  "total_questions": 2,
  "passing_score": 1,
  "passed": true,
  "feedback": "Great job! You've demonstrated understanding of basic CSS selectors and properties."
}
```

#### `/api/ask_question` (POST)
Answer a user's question about code or a step

**Request Parameters:**
- `session_id` (string, required): Project session identifier
- `code` (string, required): Current code context
- `question` (string, required): User's question
- `is_error_related` (boolean, optional): Whether question relates to an error

**Response:**
- `response` (string): AI's answer to the question

**Example:**
```json
// Request
{
  "session_id": "session_12345",
  "code": "function add(a, b) { return a + b; }",
  "question": "How do I modify this to add three numbers?",
  "is_error_related": false
}

// Response
{
  "response": "This is your 1st attempt! To modify your function to add three numbers, you'll need to add a third parameter. Here's how you can do it:\n\n```javascript\nfunction add(a, b, c) {\n  return a + b + c;\n}\n```\n\nYou would then call it with three arguments: `add(1, 2, 3)`."
}
```

### Utility Endpoints

#### `/api/get_step_attempts` (GET)
Get the number of execution attempts for a specific step

**Query Parameters:**
- `session_id` (string, required): Project session identifier
- `step_number` (integer, required): Step number to check

**Response:**
- `attempts` (integer): Number of execution attempts made

**Example:**
```
GET /api/get_step_attempts?session_id=session_12345&step_number=2

// Response
{
  "attempts": 3
}
```

#### `/api/terminate_streamlit` (POST)
Terminate a running Streamlit process

**Request Parameters:**
- `execution_id` (string, required): Identifier for the Streamlit process

**Response:**
- `success` (boolean): Whether termination was successful

**Example:**
```json
// Request
{
  "execution_id": "exec_789"
}

// Response
{
  "success": true
}
```

## How to Use the Algorithm Designer

1. **Start a New Design Session**
   - Navigate to the welcome screen
   - Click "Design Algorithm First" button in the action buttons section
   - The Algorithm Designer modal will appear with a welcome message

2. **Describe Your Project**
   - Enter a concise description of what you want to build
   - Be specific about the core functionality and purpose
   - Example: "I want to build a todo list application that allows users to add, edit, delete, and mark tasks as complete"

3. **Answer AI-Guided Questions**
   - The AI will ask you focused questions, one at a time
   - Each question helps define a specific aspect of your algorithm
   - Provide thoughtful answers that clarify your project's logic
   - The process follows these phases:
     * **Problem Understanding**: Clarifying what you're trying to build
     * **Inputs & Outputs**: Defining what goes in and comes out of your system
     * **Core Components**: Identifying the main parts of your algorithm
     * **Algorithm Steps**: Outlining the sequence of operations
     * **Process Flow**: Determining how data moves through your system
     * **Edge Cases**: Identifying potential problems and exceptions

4. **Track Your Progress**
   - Watch the progress bar advance as you answer questions
   - Note milestone markers indicating design phase transitions
   - View current phase label to understand where you are in the process
   - See percentage complete at each stage of development

5. **Request Final Algorithm**
   - When progress reaches 90%, the "Get Final Algorithm" button appears
   - Click this button to generate your complete algorithm workflow
   - Alternatively, after 7 exchanges, the final algorithm is auto-generated
   - You can also trigger completion by using keywords like "final" or "complete" in your messages

6. **Export Your Algorithm**
   - Once the algorithm is complete, export options appear
   - Choose "Download as Markdown" to save the document
   - Select "Copy to Clipboard" to paste elsewhere
   - Use this algorithm as a reference when implementing your code

7. **Implementation Reference**
   - Keep your algorithm document open as you code
   - Follow the step-by-step workflow as you build each component
   - Reference the input/output specifications as guidance
   - Handle the edge cases identified in your algorithm

## Project Architecture

### Frontend Architecture (React)

- **Component Structure**
  - React-based SPA with modular component design
  - React Hooks for state management (useState, useEffect, useRef)
  - Functional components with clear separation of concerns
  - Context API for global state sharing

- **Key Components**
  - `WelcomeScreen`: Entry point with project configuration
  - `AlgorithmDesigner`: Interactive algorithm design interface
  - `CodeEditor`: Monaco-powered code editing environment
  - `PreviewPanel`: Real-time rendering of code output

- **State Management**
  - Local component state for UI elements
  - Session-based state persistence
  - Axios for API communication
  - WebSocket for real-time interactions

- **UI/UX Design**
  - Responsive design for all screen sizes
  - Accessible component implementation
  - Animated transitions and progress indicators
  - Consistent visual language and iconography

### Backend Architecture (FastAPI)

- **Service-Oriented Architecture**
  - FastAPI framework for high-performance API
  - Modular service design with dependency injection
  - Stateless API with session management
  - Sandboxed execution environment

- **Core Services**
  - `ProjectService`: Handles project generation and step progression
  - `SessionService`: Manages user sessions and state persistence
  - `ExecutionService`: Provides code execution in sandbox
  - `AlgorithmDesignerService`: Powers the algorithm design AI interaction

- **AI Integration**
  - Google Gemini API for natural language processing
  - Prompt engineering for specific educational contexts
  - Response processing and formatting
  - Progress tracking and conversation management

- **Security**
  - Input validation and sanitization
  - Rate limiting for API endpoints
  - Sandboxed code execution
  - Error handling and logging

## Technology Stack

- **Frontend**
  - React 18+
  - Monaco Editor
  - Axios
  - ReactMarkdown
  - CSS3 with custom animations

- **Backend**
  - Python 3.8+
  - FastAPI
  - Google Generative AI (Gemini)
  - Pydantic for data validation
  - Uvicorn ASGI server

