# LeetCode AI Assistant

A modern React application to help you solve LeetCode problems with AI assistance.

## Features

- 🧠 Paste any LeetCode problem
- 💡 Get step-by-step hints without revealing the full solution
- 📝 Write code in Python, Java, or C++
- 🔍 Submit your solution for AI analysis
- 📊 Request code review, full solution, intuition, or code walkthrough

## Tech Stack

- **Frontend**: React, Material-UI
- **State Management**: React Hooks
- **API**: Axios
- **Backend**: (Requires separate implementation, currently using mock data)
- **AI**: Google Gemini API (requires backend integration)

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd leetcode-ai-assistant
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser at `http://localhost:5173`

## Deployment

To build the app for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Backend Integration

This frontend is designed to work with a backend service that communicates with AI models like Google's Gemini.

The mock API in `src/services/api.js` shows the expected API interface.

## License

This project is licensed under the MIT License. 