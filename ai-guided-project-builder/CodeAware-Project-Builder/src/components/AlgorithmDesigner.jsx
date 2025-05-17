import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/AlgorithmDesigner.css';
import ReactMarkdown from 'react-markdown';

const AlgorithmDesigner = ({ onClose }) => {
  const [projectDescription, setProjectDescription] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to the Algorithm Designer! I'll help you think through the step-by-step logic of your project before you start coding. What project would you like to build today?"
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canRequestFinal, setCanRequestFinal] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [progressStalled, setProgressStalled] = useState(false);
  const [hasRequestedFinal, setHasRequestedFinal] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check if progress is high enough to request final flowchart
  useEffect(() => {
    if (progress >= 90 && !canRequestFinal) {
      setCanRequestFinal(true);
    } else if (progress < 90 && canRequestFinal) {
      setCanRequestFinal(false);
    }
    
    // Auto-request final algorithm when progress reaches 90% and we haven't already
    if (progress >= 90 && !hasRequestedFinal && exchangeCount >= 6) {
      handleRequestFinal();
    }
  }, [progress, hasRequestedFinal, exchangeCount]);
  
  // Check if progress is stalled after several exchanges
  useEffect(() => {
    // Count user messages (exchanges) - exclude the initial assistant message
    const userMessageCount = messages.filter(msg => msg.role === 'user').length;
    setExchangeCount(userMessageCount);
    
    // Check if progress is stalled after 7-8 exchanges
    if (userMessageCount >= 7 && progress < 40) {
      setProgressStalled(true);
    } else {
      setProgressStalled(false);
    }
  }, [messages, progress]);

  // Process AI response to clean up progress tags
  const processResponse = (text) => {
    // Extract progress if present
    const progressRegex = /<progress>(\d+)%<\/progress>/;
    const progressMatch = text.match(progressRegex);
    if (progressMatch && progressMatch[1]) {
      const newProgress = parseInt(progressMatch[1], 10);
      setProgress(newProgress);
    }

    // Extract evaluation if present
    const evalRegex = /<evaluation>(.*?)<\/evaluation>/s;
    const evalMatch = text.match(evalRegex);
    
    // Remove the tags
    let cleanText = text
      .replace(progressRegex, '')
      .replace(evalRegex, '');
    
    // If there was an evaluation, add it as a highlight
    if (evalMatch && evalMatch[1]) {
      cleanText = `*${evalMatch[1].trim()}*\n\n${cleanText.trim()}`;
    }
    
    return cleanText.trim();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message to chat
    const newUserMessage = { role: 'user', content: userInput };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);
    setError('');
    setUserInput('');

    try {
      // Calculate current exchange count (including this new message)
      const currentExchangeCount = exchangeCount + 1;
      
      // Get AI response from backend
      const response = await axios.post('http://localhost:8001/api/algorithm_designer', {
        project_description: projectDescription || undefined,
        message: userInput,
        conversation_history: messages,
        request_final: false,
        boost_progress: progressStalled, 
        exchange_count: currentExchangeCount
      });

      // Save project description from first user message if not already set
      if (!projectDescription && messages.length <= 1) {
        setProjectDescription(userInput);
      }

      // Check if the response has an error field
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      // Update progress from response
      if (response.data.progress !== undefined) {
        setProgress(response.data.progress);
      }
      
      // Process the response to clean up tags
      const processedResponse = processResponse(response.data.response);
      
      // Add AI response to chat
      const aiResponse = { role: 'assistant', content: processedResponse };
      setMessages(prevMessages => [...prevMessages, aiResponse]);

      // Check if workflow is complete (AI will include "WORKFLOW_COMPLETE" in response when finished)
      if (processedResponse.includes("WORKFLOW_COMPLETE")) {
        setShowExportOptions(true);
      }

    } catch (err) {
      console.error('Error getting AI response:', err);
      
      // Add error message to chat for better UX
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an error: ${err.message || 'Could not connect to the AI service'}. Please try again later.`
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setError(`Failed to get a response: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestFinal = async () => {
    // Prevent duplicate requests
    if (hasRequestedFinal || isLoading) return;
    
    setIsLoading(true);
    setError('');
    setHasRequestedFinal(true);
    
    try {
      // Add user message to chat
      const finalRequestMessage = { 
        role: 'user', 
        content: "Great, I think we've covered everything. Please provide the complete algorithm workflow now." 
      };
      setMessages(prevMessages => [...prevMessages, finalRequestMessage]);
      
      // Request final algorithm
      const response = await axios.post('http://localhost:8001/api/algorithm_designer', {
        project_description: projectDescription || undefined,
        message: "Please provide the complete algorithm workflow.",
        conversation_history: messages,
        request_final: true,
        exchange_count: exchangeCount + 1
      });

      // Process the response to clean up tags
      const processedResponse = processResponse(response.data.response);
      
      // Add AI response to chat
      const aiResponse = { role: 'assistant', content: processedResponse };
      setMessages(prevMessages => [...prevMessages, aiResponse]);

      // Check if workflow is complete
      if (processedResponse.includes("WORKFLOW_COMPLETE")) {
        setShowExportOptions(true);
        setProgress(100); // Ensure progress bar shows 100%
      }
      
    } catch (err) {
      console.error('Error getting final algorithm:', err);
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ Sorry, I couldn't generate the final algorithm: ${err.message || 'Unknown error'}. Please try again.`
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setError(`Failed to get final algorithm: ${err.message}`);
      setHasRequestedFinal(false); // Allow retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format) => {
    // Extract algorithm steps from conversation
    const algorithmText = extractAlgorithmSteps();
    
    if (format === 'markdown') {
      // Create markdown file download
      const element = document.createElement('a');
      const file = new Blob([algorithmText], {type: 'text/markdown'});
      element.href = URL.createObjectURL(file);
      element.download = 'algorithm_workflow.md';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (format === 'copy') {
      // Copy to clipboard
      navigator.clipboard.writeText(algorithmText)
        .then(() => alert('Algorithm copied to clipboard!'))
        .catch(err => console.error('Failed to copy algorithm:', err));
    }
  };

  const extractAlgorithmSteps = () => {
    // Find the final algorithm in the conversation
    // This is a simple implementation - could be improved with more sophisticated parsing
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    const lastMessage = assistantMessages[assistantMessages.length - 1].content;
    
    // Try to extract the final algorithm section
    const sections = lastMessage.split("Here's the finalized algorithm workflow:");
    if (sections.length > 1) {
      return sections[1].trim();
    }
    
    // If not found that way, return the last assistant message
    return lastMessage;
  };
  
  // Helper function to get milestone label based on progress
  const getMilestoneLabel = () => {
    if (progress < 15) return "Getting Started";
    if (progress < 30) return "Understanding Problem";
    if (progress < 45) return "Defining Inputs/Outputs";
    if (progress < 60) return "Designing Components";
    if (progress < 75) return "Creating Process Flow";
    if (progress < 90) return "Handling Edge Cases";
    if (progress < 100) return "Finalizing Algorithm";
    return "Algorithm Complete";
  };

  return (
    <div className="algorithm-designer">
      <div className="algorithm-designer-header">
        <h2>Algorithm Designer</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="progress-container">
        <div className="progress-info">
          <span className="progress-milestone">{getMilestoneLabel()}</span>
          <span className="progress-percentage">
            {progress >= 90 && !hasRequestedFinal
              ? "Ready for final algorithm!" 
              : progressStalled 
                ? `Progress: ${progress}% (Simplifying...)` 
                : `Progress: ${progress}%`}
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{width: `${progress}%`}}
          ></div>
          {/* Add milestone markers */}
          <div className="milestone-markers">
            <span className="milestone" style={{left: '15%'}} title="Problem Understanding"></span>
            <span className="milestone" style={{left: '30%'}} title="Inputs & Outputs"></span>
            <span className="milestone" style={{left: '45%'}} title="Core Components"></span>
            <span className="milestone" style={{left: '60%'}} title="Process Flow"></span>
            <span className="milestone" style={{left: '75%'}} title="Edge Cases"></span>
            <span className="milestone" style={{left: '90%'}} title="Ready for Algorithm"></span>
          </div>
        </div>
      </div>
      
      <div className="algorithm-designer-content">
        <div className="chat-container">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant-message">
              <div className="thinking-indicator">
                <span className="thinking-dot"></span>
                <span className="thinking-dot"></span>
                <span className="thinking-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-container">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Describe your project or respond to the AI's questions..."
              disabled={isLoading || hasRequestedFinal}
            />
            <button 
              type="submit" 
              disabled={isLoading || !userInput.trim() || hasRequestedFinal}
            >
              {isLoading ? '...' : 'Send'}
            </button>
            {canRequestFinal && !hasRequestedFinal && (
              <button 
                type="button" 
                className="request-final-btn" 
                onClick={handleRequestFinal}
                disabled={isLoading}
              >
                Get Final Algorithm
              </button>
            )}
          </form>
        </div>
        
        {showExportOptions && (
          <div className="export-options">
            <h3>Your algorithm workflow is ready!</h3>
            <div className="export-buttons">
              <button onClick={() => handleExport('markdown')}>
                📥 Download as Markdown
              </button>
              <button onClick={() => handleExport('copy')}>
                📋 Copy to Clipboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgorithmDesigner; 