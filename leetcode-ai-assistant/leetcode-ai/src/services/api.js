import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with the provided key
const GOOGLE_API_KEY = "AIzaSyCMEPSK6GFQiZm48zO5dgE1QaoGYmcfQGw";
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// This would typically be an environment variable
const API_URL = 'https://your-backend-url.com/api';

// Mock API for now - in a real app you would connect to your Gemini backend
export const aiApi = {
  // Get hints for a problem
  getHints: async (problemText) => {
    try {
      const prompt = `
You are a coding mentor. Give 3 strategic hints to help solve this LeetCode problem step-by-step without revealing the full solution.
Format them clearly like:
Hint 1: ...
Hint 2: ...
Hint 3: ...

Problem:
${problemText}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract hints from the text
      const hintMatches = text.match(/Hint \d+:(.*?)(?=Hint \d+:|$)/gs) || [];
      const hints = hintMatches.map(hint => {
        return hint.replace(/Hint \d+:/, '').trim();
      });

      return {
        data: {
          hints: hints.length > 0 ? hints : [
            "First, think about the brute force approach and its time complexity",
            "Consider using an appropriate data structure to optimize lookups",
            "Try finding patterns in the problem that can help reduce time complexity"
          ]
        }
      };
    } catch (error) {
      console.error("Error getting hints:", error);
      // Fallback to default hints
      return {
        data: {
          hints: [
            "First, think about the brute force approach and its time complexity",
            "Consider using an appropriate data structure to optimize lookups",
            "Try finding patterns in the problem that can help reduce time complexity"
          ]
        }
      };
    }
  },
  
  // Get code review
  getReview: async (problemText, code, explanation, language) => {
    try {
      const prompt = `You are a coding interview coach.
The user was given this problem:
${problemText}

They selected the language: ${language}

They wrote the following code:
${code}

Their explanation of their logic was:
${explanation || "No explanation provided."}

Give feedback: is their logic correct? What edge cases might they miss? Any better approaches?
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        data: {
          review: text
        }
      };
    } catch (error) {
      console.error("Error getting review:", error);
      return {
        data: {
          review: "Error communicating with the AI model. Please try again later."
        }
      };
    }
  },
  
  // Get full solution
  getSolution: async (problemText, language) => {
    try {
      const prompt = `Provide the optimal ${language} solution to this problem and explain it clearly:

${problemText}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        data: {
          solution: text
        }
      };
    } catch (error) {
      console.error("Error getting solution:", error);
      return {
        data: {
          solution: "Error communicating with the AI model. Please try again later."
        }
      };
    }
  },
  
  // Get intuition behind problem
  getIntuition: async (problemText) => {
    try {
      const prompt = `
You're a helpful tutor. Explain the intuition behind solving this LeetCode problem. What key ideas, thought patterns, or observations help crack the problem? Avoid giving the full code or solution.

Problem:
${problemText}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        data: {
          intuition: text
        }
      };
    } catch (error) {
      console.error("Error getting intuition:", error);
      return {
        data: {
          intuition: "Error communicating with the AI model. Please try again later."
        }
      };
    }
  },
  
  // Get dry run and explanation
  getDryRun: async (problemText, code, language) => {
    try {
      const prompt = `
You're a coding teacher. Given this LeetCode problem and the user's solution, perform a dry run using an example test case. Walk through how the code behaves line-by-line.

Then, explain the intuition behind the dry run: what insights can we gather from it about why the solution works or fails.

Problem:
${problemText}

User's code:
${code}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        data: {
          dryRun: text
        }
      };
    } catch (error) {
      console.error("Error getting dry run:", error);
      return {
        data: {
          dryRun: "Error communicating with the AI model. Please try again later."
        }
      };
    }
  }
};

export default aiApi; 