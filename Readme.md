# CodeAware: Redefining Learning in the Age of AI

<div align="center">
  <img width="1078" alt="CodeAware Platform Overview" src="https://github.com/user-attachments/assets/0ce1839c-5be2-4055-a794-8b8ae62ad787" />
  <h3>Team DEV-inity | Team #45 | EduAIthon</h3>
  <p>A comprehensive AI-driven learning platform empowering developers at every stage of their coding journey</p>
</div>

<hr>

## 🐳 Getting Started with Docker

### Prerequisites

1. **Install Docker**:
   - **Mac**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - **Windows**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - **Linux**: 
     ```bash
     sudo apt-get update
     sudo apt-get install docker-ce docker-ce-cli containerd.io
     ```

2. **Verify Docker installation**:
   ```bash
   docker --version
   ```

### Running the Application

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd [repository-directory]
   ```

2. **Set environment variables**:
   Create a `.env` file in the root directory with:
   ```
   GEMINI_API_KEY=AIzaSyCMEPSK6GFQiZm48zO5dgE1QaoGYmcfQGw
   ```

3. **Start Docker Desktop** (Mac & Windows):
   - Open the Docker Desktop application
   - Wait for it to start completely (status: Running)

4. **Run the application**:
   ```bash
   docker-compose up
   ```

5. **Access the applications** in your browser:
   - AI-Guided Project Builder: http://localhost:5177
   - AI Pair-Programmer: http://localhost:3000
   - Debugging Battles: http://localhost:5176
   - LeetCode AI Assistant: http://localhost:5175

### What's Running

This command starts 7 services:
- 4 frontend applications (React/Vite)
- 2 Python/FastAPI backend services
- 1 Node.js Express backend service

To stop all services, press `Ctrl+C` in the terminal where docker-compose is running.

<hr>

## 🚀 Platform Overview

**CodeAware** is an innovative educational platform that leverages AI to transform the way developers learn to code, debug, and solve problems. Our platform consists of four powerful tools designed to address different aspects of the coding journey, from project creation to algorithmic problem-solving.

What sets CodeAware apart is its unique approach to learning – we don't just provide solutions, we guide learners through a structured discovery process that builds true understanding and self-sufficiency.

<hr>

## 🛠️ Our Tools

### 1. AI-Guided Project Builder

<div align="center">
  <img width="838" alt="AI-Guided Project Builder" src="https://github.com/user-attachments/assets/fb07a337-5a96-4a88-a068-f984504e9fbb" />
</div>

**Transform abstract ideas into concrete code projects with AI mentorship**

The AI-Guided Project Builder helps users take their project ideas from concept to implementation through a structured, step-by-step approach. Unlike traditional tutorials, our tool adapts to the user's specific project needs and learning pace.

#### ✨ Key Features:

- **Step-by-Step Project Development**: Break down complex projects into manageable learning modules.
  <div align="center">
    <img width="1512" alt="Step-by-Step Project Building" src="https://github.com/user-attachments/assets/51ca7a9a-8cf2-4a55-9ce2-3357d21916f7" />
  </div>

- **Real-time Knowledge Assessment**: Evaluate understanding at each stage to ensure solid foundations.
  <div align="center">
    <img width="612" alt="Real-time Assessment and AI Assistance" src="https://github.com/user-attachments/assets/1c04881a-80a4-4fd6-a916-f6900283ecd3" />
  </div>

- **Contextual AI Assistance**: Get help that understands your entire project context, not just isolated code snippets.

- **Intelligent Tech Stack Recommendations**: Receive suggestions for technologies that best fit your project requirements.

#### 🏆 Benefits:

- Learn by doing with personalized guidance
- Build a portfolio of real, working projects
- Develop project planning and architectural skills
- Gain confidence in choosing appropriate technologies

<hr>

### 2. AI Pair-Programmer

<div align="center">
  <img width="1373" alt="AI Pair-Programmer Interface" src="https://github.com/user-attachments/assets/e016172c-eb95-4bcc-8e48-84668265642f" />
</div>

**Never code alone again – your AI coding partner for skill assessment and targeted improvement**

The AI Pair-Programmer acts as your personal coding mentor, identifying knowledge gaps and helping you strengthen your weakest areas through interactive learning and practice.

#### ✨ Key Features:

- **Personalized Skill Assessment**: Identify specific areas for improvement in your coding knowledge.
  <div align="center">
    <img width="778" alt="Skill Assessment" src="https://github.com/user-attachments/assets/0d96cd33-17b2-47e8-bafc-05ea96687063" />
  </div>

- **Targeted Learning Modules**: Access specialized learning materials for your identified weak areas.
  <div align="center">
    <img width="860" alt="Targeted Learning - Part 1" src="https://github.com/user-attachments/assets/7b657e3d-c066-4c8f-9073-fcbf83dab071" />
    <img width="868" alt="Targeted Learning - Part 2" src="https://github.com/user-attachments/assets/a2eb7702-0d25-4f2e-9b62-0637f3acff3a" />
    <img width="858" alt="Targeted Learning - Part 3" src="https://github.com/user-attachments/assets/47fc57e5-20e5-497b-9697-2057e094a779" />
  </div>

- **Interactive Coding Environment**: Practice and reinforce new concepts in a real-time coding editor.
  <div align="center">
    <img width="1308" alt="Interactive Coding Environment" src="https://github.com/user-attachments/assets/29f87b22-4360-4fec-af3a-82868bd14772" />
  </div>

- **Progressive Hint System**: Receive gradually increasing guidance that encourages problem-solving.

#### 🏆 Benefits:

- Identify and strengthen knowledge gaps
- Learn at your own pace with personalized guidance
- Apply concepts immediately through hands-on practice
- Develop stronger problem-solving strategies

<hr>

### 3. Debugging Battles & Path to Open Source

<div align="center">
  <img width="754" alt="Debugging Battles Interface" src="https://github.com/user-attachments/assets/08175a7d-523c-45d2-8d02-a46f04b46293" />
</div>

**Level up your debugging skills and prepare for real-world contributions**

Debugging Battles provides intentionally buggy code at various difficulty levels, challenging you to find and fix issues. As you advance, transition to solving real open-source issues, bridging the gap between practice and real-world contribution.

#### ✨ Key Features:

- **Customized Debugging Challenges**: Choose your language and difficulty level for tailored practice.

- **Bug-hunting Interface**: User-friendly environment for identifying and fixing errors.
  <div align="center">
    <img width="1512" alt="Bug-hunting Interface" src="https://github.com/user-attachments/assets/4efa4dcf-fd17-48c4-83f0-2f63468795ca" />
  </div>

- **Real GitHub Issue Integration**: Practice with actual open-source issues that match your skill level.
  <div align="center">
    <img width="800" alt="GitHub Issues Integration" src="https://github.com/user-attachments/assets/d346b402-1c3f-4b45-89cc-4979598af0ba" />
  </div>

- **Guided Debugging Process**: Learn systematic approaches to troubleshooting code.

#### 🏆 Benefits:

- Develop crucial debugging skills valued in professional settings
- Build confidence in fixing complex issues
- Learn to read and understand others' code
- Prepare for real-world open-source contributions

<hr>

### 4. LeetCode (DSA) AI Assistant

<div align="center">
  <img width="891" alt="LeetCode AI Assistant Interface" src="https://github.com/user-attachments/assets/039e0f57-d96a-4486-9180-7f97f1a16d25" />
</div>

**Master algorithms and ace technical interviews with personalized AI guidance**

The LeetCode AI Assistant helps you tackle data structures and algorithms problems with a unique approach that promotes understanding rather than memorization. Get progressive hints, visual explanations, and personalized feedback.

#### ✨ Key Features:

- **Step-by-Step Hints**: Receive incremental guidance that helps you solve problems yourself.
  <div align="center">
    <img width="1051" alt="Step-by-Step Hints" src="https://github.com/user-attachments/assets/8adb3c28-c548-4617-b1b9-656eccad0972" />
  </div>

- **Intuitive Dry-Run Visualizations**: See how algorithms work step-by-step with clear visualizations.
  <div align="center">
    <img width="1040" alt="Dry-Run Visualizations" src="https://github.com/user-attachments/assets/7f842757-89fa-4254-9cc0-966d76c3f408" />
  </div>

- **Algorithm Intuition Building**: Learn the "why" behind solutions, not just the "how".
  <div align="center">
    <img width="1068" alt="Algorithm Intuition" src="https://github.com/user-attachments/assets/85ad4187-7350-4a67-9480-737a2d72db57" />
  </div>

- **Code Review and Optimization**: Get feedback on your solutions with suggestions for improvement.
  <div align="center">
    <img width="1095" alt="Code Review and Optimization" src="https://github.com/user-attachments/assets/e5814fc7-62ac-4436-88d1-4a66593c0123" />
  </div>

#### 🏆 Benefits:

- Develop strong algorithmic thinking skills
- Prepare effectively for technical interviews
- Build confidence in solving complex problems
- Learn optimal approaches to common algorithm patterns

<hr>

## 🌟 Why CodeAware?

### Pedagogical Approach

CodeAware is built on the principle that true learning happens when:
- Learners discover solutions through guided exploration
- Feedback is immediate and contextual
- Practice is hands-on and directly applicable
- Support is available but doesn't replace thinking

### Technical Innovation

Our platform leverages:
- State-of-the-art AI language models
- Real-time code analysis
- Adaptive learning algorithms
- Integration with real-world coding environments

### User Benefits

Users of CodeAware experience:
- Accelerated learning curves
- Deeper understanding of concepts
- Increased confidence in real-world coding
- Development of self-sufficient problem-solving skills

<hr>

## 🔮 Future Roadmap

- **Community Features**: Collaborative learning spaces and peer review systems
- **Progress Tracking**: Comprehensive analytics to visualize skill development
- **Extended Language Support**: Adding more programming languages and frameworks
- **Enterprise Integration**: Tools for team upskilling and technical assessment

<hr>

<div align="center">
  <h3>DEV-inity | Team #45 | EduAIthon</h3>
  <p>CodeAware: Redefining Learning in the Age of AI</p>
</div>






