import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Split from 'react-split';
import CodeEditor from './CodeEditor';
import OutputDisplay from './OutputDisplay';
import ProjectStep from './ProjectStep';
import '../styles/ProjectBuilder.css';
import BASE_URL from './apiconfig';


const ProjectBuilder = ({ sessionData, onReset }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectSteps, setProjectSteps] = useState([]);
  const [projectDetails, setProjectDetails] = useState({});
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [pythonCode, setPythonCode] = useState('');
  const [combinedHtml, setCombinedHtml] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('html');
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [verifyingQuiz, setVerifyingQuiz] = useState(false);
  const [projectCompleted, setProjectCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [streamlitExecutionId, setStreamlitExecutionId] = useState(null);
  const [currentStepAttempts, setCurrentStepAttempts] = useState(0);

  // Custom renderer components for ReactMarkdown
  const markdownComponents = {
    // Add the markdown-content class to the root div
    root: ({ node, ...props }) => <div className="markdown-content" {...props} />,
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      return !inline ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          wrapLines={true}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  // Special components for quiz options (no wrapper div to avoid nesting issues in labels)
  const optionComponents = {
    // Don't add a wrapper div for options, as they're inside labels
    p: ({node, ...props}) => <span {...props} />,
    code({node, inline, className, children, ...props}) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  useEffect(() => {
    // Parse the initial Gemini response when component mounts
    if (sessionData && sessionData.geminiResponse) {
      try {
        const responseObject = JSON.parse(sessionData.geminiResponse);
        console.log("Initial project data:", responseObject);
        
        setProjectDetails({
          title: responseObject.project_title,
          description: responseObject.project_description,
          totalSteps: responseObject.total_steps || 8 // Fallback to 8 if not specified
        });
        
        if (responseObject.steps && responseObject.steps.length > 0) {
          setProjectSteps(responseObject.steps);
        }
        
        // Initialize step attempts
        setCurrentStepAttempts(0);
      } catch (err) {
        console.error('Error parsing Gemini response:', err);
        setError('There was an issue setting up your project. Please try again.');
      }
    }
  }, [sessionData]);

  // Combine HTML and CSS when either changes
  useEffect(() => {
    if (htmlCode || cssCode) {
      const combined = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
        ${cssCode}
        </style>
        <script>
        ${jsCode}
        </script>
      </head>
      <body>
      ${htmlCode}
      </body>
      </html>
      `;
      setCombinedHtml(combined);
    }
  }, [htmlCode, cssCode, jsCode]);

  const handleCodeChange = (code, language) => {
    console.log(`Code changed for ${language}:`, code ? code.substring(0, 20) + "..." : "empty");
    setCurrentLanguage(language);
    
    switch (language) {
      case 'html':
        setHtmlCode(code);
        break;
      case 'css':
        setCssCode(code);
        break;
      case 'javascript':
        setJsCode(code);
        break;
      case 'python':
        setPythonCode(code);
        break;
      default:
        break;
    }
  };

  const getCurrentCode = () => {
    switch (currentLanguage) {
      case 'html':
        return htmlCode;
      case 'css':
        return cssCode;
      case 'javascript':
        return jsCode;
      case 'python':
        return pythonCode;
      default:
        return '';
    }
  };

  const cleanupStreamlit = async () => {
    if (streamlitExecutionId) {
      try {
        await axios.post(`${BASE_URL}/terminate_streamlit`, {
          execution_id: streamlitExecutionId
        });
        setStreamlitExecutionId(null);
      } catch (err) {
        console.error('Error terminating Streamlit process:', err);
      }
    }
  };
  
  useEffect(() => {
    return () => {
      // Cleanup Streamlit processes when component unmounts
      cleanupStreamlit();
    };
  }, []);

  const handleCodeSubmit = async (code, language) => {
    // Clean up any previous Streamlit process first
    await cleanupStreamlit();
    
    setIsLoading(true);
    setError(null);

    try {
      if (language === 'html' || language === 'css' || language === 'javascript') {
        // For HTML/CSS/JS, handle preview
        const response = await axios.post(`${BASE_URL}/render_website`, {
          html_code: htmlCode,
          css_code: cssCode,
          session_id: sessionData.sessionId  // Pass session ID to track execution attempts
        });

        // Update attempt count after successful execution
        const updatedAttempts = currentStepAttempts + 1;
        setCurrentStepAttempts(updatedAttempts);
        
        setExecutionResult({
          code,
          ...(language === 'html' ? { html_content: code } : 
             language === 'css' ? { css_content: code } : {}),
          exit_code: 0,
          stdout: '',
          stderr: ''
        });
      } else {
        // For Python, send to backend for execution
        const response = await axios.post(`${BASE_URL}/execute`, {
          code,
          language,
          session_id: sessionData.sessionId  // Pass session ID to track execution attempts
        });

        // Update attempt count after successful execution  
        const updatedAttempts = currentStepAttempts + 1;
        setCurrentStepAttempts(updatedAttempts);
        
        // If this is a Streamlit app, keep track of the execution ID
        if (response.data.is_streamlit && !response.data.streamlit_error) {
          setStreamlitExecutionId(response.data.execution_id);
        }

        setExecutionResult({
          ...response.data,
          code // Save the code that was executed
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during code execution');
      console.error('Error executing code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStep = async () => {
    // Check if there's any code in the editor for the current step
    const currentCode = getCurrentCode();
    if (!currentCode || currentCode.trim() === '') {
      setError('Please write some code for this step before proceeding.');
      return;
    }
    
    // Show the quiz when the user wants to complete a step
    setShowQuiz(true);
    setLoadingQuestions(true);
    setError(null);
    
    try {
      // Get quiz questions for this step
      console.log("Getting quiz questions for step:", currentStep);
      const response = await axios.post(`${BASE_URL}/get_step_questions`, {
        session_id: sessionData.sessionId,
        step_number: currentStep
      });
      
      console.log("Quiz questions response:", response.data);
      
      if (response.data && response.data.questions && response.data.questions.length > 0) {
        setQuizQuestions(response.data.questions);
        
        // Initialize answer state for each question
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.question_id] = '';
        });
        setUserAnswers(initialAnswers);
      } else {
        // If no questions are returned, show an error
        console.error('No quiz questions returned from API');
        setError('Failed to load quiz questions - no questions returned');
        
        // Hide quiz after a delay to allow user to see the error
        setTimeout(() => {
          setShowQuiz(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error fetching quiz questions:', err);
      setError(`Failed to load quiz questions. Please try again. ${err.response?.data?.detail || ''}`);
      
      // Hide quiz after a delay
      setTimeout(() => {
        setShowQuiz(false);
      }, 3000);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    
    // Check if all questions are answered
    const unansweredQuestions = Object.entries(userAnswers).filter(([_, answer]) => !answer).length;
    if (unansweredQuestions > 0) {
      setError(`Please answer all ${unansweredQuestions} remaining questions before proceeding.`);
      return;
    }
    
    setVerifyingQuiz(true);
    setError(null);
    
    try {
      // Format answers for submission
      const formattedAnswers = quizQuestions.map(question => ({
        question_id: question.question_id,
        answer: userAnswers[question.question_id],
        correct_answer: question.correct_answer
      }));
      
      const response = await axios.post(`${BASE_URL}/verify_step_completion`, {
        session_id: sessionData.sessionId,
        step_number: currentStep,
        user_answers: formattedAnswers
      });
      
      setQuizResult(response.data);
      
      // If all answers correct, proceed to next step after a delay
      if (response.data.correct) {
        // Store current code before proceeding to next step
        const currentEditorCode = getCurrentCode();
        const currentEditorLanguage = currentLanguage;
        
        setTimeout(() => {
          // First hide the quiz
          setShowQuiz(false);
          setUserAnswers({});
          setQuizResult(null);
          
          // Now proceed to next step, but we'll use a customized version that doesn't modify code
          // Clean up any running Streamlit process
          cleanupStreamlit().then(() => {
            // Check if we're already on the last step
            if (currentStep + 1 >= (projectDetails.totalSteps || 8)) {
              setProjectCompleted(true);
              setCompletionMessage("Congratulations! You have completed the project.");
              return;
            }
            
            setIsLoading(true);
            setError(null);
            
            // Proceed to next step without sending a special flag
            axios.post(`${BASE_URL}/next_step_test`, {
              project_type: sessionData.projectType,
              expertise_level: sessionData.expertiseLevel,
              project_idea: sessionData.projectIdea,
              current_step: currentStep,
              user_code: currentEditorCode,
              session_id: sessionData.sessionId,
              preserve_code: true // Special flag to ensure code isn't modified
            }, {
              headers: { 'Content-Type': 'application/json' }
            })
            .then(response => {
              console.log("Backend response:", response.data);
              const { response: geminiResponse } = response.data;
              
              try {
                const nextStepData = JSON.parse(geminiResponse);
                console.log("Parsed step data:", nextStepData);
                
                // Check if the project is completed
                if (nextStepData.project_completed) {
                  setProjectCompleted(true);
                  setCompletionMessage(nextStepData.message || "Congratulations! You have completed the project.");
                  return;
                }
                
                // Add the new step to our steps array
                setProjectSteps(prev => [...prev, nextStepData]);
                
                // Ensure we never exceed total steps
                const nextStepNumber = currentStep + 1;
                setCurrentStep(nextStepNumber);
                
                // Reset attempts for the new step
                setCurrentStepAttempts(0);
                
                // CRITICAL: Always preserve existing code - DO NOT UPDATE code here
                // Code from previous steps should be retained
              } catch (err) {
                console.error('Error parsing step data:', err);
                console.error('Raw response:', geminiResponse);
                setError('There was an issue loading the next step. Please try again.');
              }
            })
            .catch(err => {
              console.error('Error fetching next step:', err);
              console.error('Error details:', err.response?.data || err.message);
              setError('Failed to load the next step. Please try again.');
            })
            .finally(() => {
              setIsLoading(false);
            });
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Error verifying quiz answers:', err);
      setError('Failed to verify your answers. Please try again.');
    } finally {
      setVerifyingQuiz(false);
    }
  };

  const handleNextStep = async () => {
    // Clean up any running Streamlit process
    await cleanupStreamlit();
    
    // Check if we're already on the last step
    if (currentStep + 1 >= (projectDetails.totalSteps || 8)) {
      setProjectCompleted(true);
      setCompletionMessage("Congratulations! You have completed the project.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Next step request payload:", {
        project_type: sessionData.projectType,
        expertise_level: sessionData.expertiseLevel,
        project_idea: sessionData.projectIdea,
        current_step: currentStep,
        user_code: getCurrentCode(),
        session_id: sessionData.sessionId
      });
      
      // Using the test endpoint for debugging
      const response = await axios.post(`${BASE_URL}/next_step_test`, {
        project_type: sessionData.projectType,
        expertise_level: sessionData.expertiseLevel,
        project_idea: sessionData.projectIdea,
        current_step: currentStep,
        user_code: getCurrentCode(),
        session_id: sessionData.sessionId
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log("Backend response:", response.data);
      
      const { response: geminiResponse } = response.data;
      
      try {
        const nextStepData = JSON.parse(geminiResponse);
        console.log("Parsed step data:", nextStepData);
        
        // Check if the project is completed
        if (nextStepData.project_completed) {
          setProjectCompleted(true);
          setCompletionMessage(nextStepData.message || "Congratulations! You have completed the project.");
          return;
        }
        
        // Add the new step to our steps array
        setProjectSteps(prev => [...prev, nextStepData]);
        
        // Ensure we never exceed total steps
        const nextStepNumber = currentStep + 1;
        setCurrentStep(nextStepNumber);
        
        // Reset attempts for the new step
        setCurrentStepAttempts(0);
        
        // IMPORTANT: Only set starter code for absolute beginners on step 1 (the very first step)
        // For all other steps, retain the existing code
        const isVeryFirstStep = currentStep === 0;
        const isBeginner = sessionData.expertiseLevel === 'beginner';
        
        if (isVeryFirstStep && isBeginner && nextStepData.code) {
          if (sessionData.projectType === 'html+css+js') {
            if (nextStepData.language === 'html') {
              setHtmlCode(nextStepData.code);
              setCurrentLanguage('html');
            } else if (nextStepData.language === 'css') {
              setCssCode(nextStepData.code);
              setCurrentLanguage('css');
            } else if (nextStepData.language === 'javascript') {
              setJsCode(nextStepData.code);
              setCurrentLanguage('javascript');
            }
          } else { // python+streamlit
            setPythonCode(nextStepData.code);
            setCurrentLanguage('python');
          }
        }
        
        // For non-beginners or any step after the first, we do not update the code
        // This preserves the user's existing code between steps
      } catch (err) {
        console.error('Error parsing step data:', err);
        console.error('Raw response:', geminiResponse);
        setError('There was an issue loading the next step. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching next step:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load the next step. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    
    if (!userQuestion.trim()) return;
    
    setAskingQuestion(true);
    setError(null);
    
    // Determine if the question is related to an error
    const isErrorRelated = detectErrorQuestion(userQuestion);
    
    try {
      const response = await axios.post(`${BASE_URL}/ask_question`, {
        question: userQuestion,
        code: getCurrentCode(),
        project_type: sessionData.projectType,
        session_id: sessionData.sessionId,
        is_error_related: isErrorRelated
      });
      
      setAiResponse(response.data.response);
      
      // Clear the question input
      setUserQuestion('');
    } catch (err) {
      console.error('Error asking question:', err);
      setError('Failed to get an answer. Please try again.');
    } finally {
      setAskingQuestion(false);
    }
  };
  
  // Helper function to detect if a question is error-related
  const detectErrorQuestion = (question) => {
    // Common error-related keywords and phrases
    const errorKeywords = [
      'error', 'bug', 'issue', 'problem', 'wrong', 'fail', 'doesn\'t work', 
      'does not work', 'broken', 'fix', 'debug', 'exception', 'traceback', 
      'TypeError', 'SyntaxError', 'ValueError', 'IndexError', 'KeyError',
      'not working', 'undefined', 'null', 'NaN', 'Uncaught', 'crash',
      'why isn\'t', 'why is not', 'help me fix', 'what\'s wrong', 'what is wrong',
      'incorrect', 'failing', 'can\'t get it to', 'cannot get it to',
      'stuck', 'trouble', 'struggling'
    ];
    
    const questionLower = question.toLowerCase();
    
    // Check if any error keywords are present in the question
    return errorKeywords.some(keyword => questionLower.includes(keyword.toLowerCase()));
  };

  // Make sure the progress indicator doesn't exceed 100%
  const calculateProgress = () => {
    const total = projectDetails.totalSteps || 1;
    const current = currentStep + 1;
    const percentage = Math.min(Math.round((current / total) * 100), 100);
    return percentage;
  };

  // Get execution attempts when the current step changes
  useEffect(() => {
    if (sessionData && sessionData.sessionId && currentStep >= 0) {
      // Fetch current step attempts from the backend
      const fetchStepAttempts = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/get_step_attempts`, {
            params: {
              session_id: sessionData.sessionId,
              step_number: currentStep
            }
          });
          
          if (response.data && response.data.attempts !== undefined) {
            setCurrentStepAttempts(response.data.attempts);
          }
        } catch (error) {
          console.error("Error fetching step attempts:", error);
          // Don't set an error for the user - this is a background task
        }
      };
      
      fetchStepAttempts();
    }
  }, [currentStep, sessionData]);

  if (projectCompleted) {
    const inspirationalQuotes = [
      "Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.",
      "The best way to predict the future is to invent it.",
      "Good code is its own best documentation.",
      "Programming isn't about what you know; it's about what you can figure out.",
      "First, solve the problem. Then, write the code.",
      "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
      "The most disastrous thing that you can ever learn is your first programming language.",
      "It's not a bug; it's an undocumented feature!",
      "The only way to learn a new programming language is by writing programs in it.",
      "Code is like humor. When you have to explain it, it's bad."
    ];
    
    // Select a random quote
    const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
    
    return (
      <div className="project-builder">
        <div className="project-header">
          <div className="project-info">
            <h1>{projectDetails.title || 'Project Builder'}</h1>
            <p>{projectDetails.description || 'Build your project step by step'}</p>
          </div>
          <button className="reset-button" onClick={onReset}>
            Start New Project
          </button>
        </div>
        
        <div className="project-completed">
          <div className="completion-message">
            <h2>🎉 Project Completed! 🎉</h2>
            <p>{completionMessage}</p>
            <div className="completion-details">
              <h3>Project Summary</h3>
              <p>You've successfully completed all {projectDetails.totalSteps} steps of this project.</p>
              <p>Technology stack: {sessionData.projectType}</p>
              <p>Expertise level: {sessionData.expertiseLevel}</p>
              <div className="quote-container">
                <blockquote>{randomQuote}</blockquote>
              </div>
            </div>
            <button className="new-project-button" onClick={onReset}>
              Start a New Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-builder">
      <div className="project-header">
        <div className="project-info">
          <h1>{projectDetails.title || 'Project Builder'}</h1>
          <p>{projectDetails.description || 'Build your project step by step'}</p>
          <div className="project-meta">
            <span className="tech-stack">Tech: {sessionData.projectType}</span>
            <span className="expertise">Level: {sessionData.expertiseLevel}</span>
            <span className="step-counter">
              Step {currentStep + 1} of {projectDetails.totalSteps || '?'}
              {projectDetails.totalSteps > 0 && (
                <span className="progress-indicator">
                  {calculateProgress()}% complete
                </span>
              )}
            </span>
          </div>
        </div>
        <button className="reset-button" onClick={onReset}>
          Start New Project
        </button>
      </div>

      <Split 
        className="project-content" 
        sizes={[30, 70]} 
        minSize={[200, 400]}
        gutterSize={8}
        gutterAlign="center"
        snapOffset={50}
        direction="horizontal"
        cursor="col-resize"
        dragInterval={1}
      >
        <div className="guidance-panel">
          <ProjectStep 
            stepData={projectSteps[currentStep]} 
            stepNumber={currentStep + 1}
            executionAttempts={currentStepAttempts}
          />
          
          {showQuiz ? (
            <div className="quiz-section">
              <h3>Before proceeding to the next step...</h3>
              <p><ReactMarkdown components={markdownComponents}>Please answer these questions about what you've learned:</ReactMarkdown></p>
              
              {loadingQuestions ? (
                <div className="loading-quiz">Loading questions...</div>
              ) : (
                <form onSubmit={handleSubmitQuiz} className="quiz-form">
                  {quizQuestions.map((question, index) => (
                    <div key={question.question_id} className="quiz-question">
                      <p className="question-text"><strong>Question {index + 1}:</strong> <ReactMarkdown components={markdownComponents}>{question.question_text}</ReactMarkdown></p>
                      <div className="question-options">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="option-container">
                            <input
                              type="radio"
                              id={`${question.question_id}-${optIndex}`}
                              name={question.question_id}
                              value={option}
                              checked={userAnswers[question.question_id] === option}
                              onChange={() => handleAnswerSelect(question.question_id, option)}
                              disabled={verifyingQuiz}
                            />
                            <label htmlFor={`${question.question_id}-${optIndex}`}><ReactMarkdown components={optionComponents}>{option}</ReactMarkdown></label>
                          </div>
                        ))}
                      </div>
                      
                      {quizResult && quizResult.question_feedback && (
                        <div className={`feedback ${
                          quizResult.question_feedback.find(f => f.question_id === question.question_id)?.correct 
                            ? 'correct' 
                            : 'incorrect'
                        }`}>
                          <ReactMarkdown components={markdownComponents}>{quizResult.question_feedback.find(f => f.question_id === question.question_id)?.feedback}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="quiz-controls">
                    <button 
                      type="submit"
                      disabled={verifyingQuiz || Object.values(userAnswers).some(a => !a)}
                      className="submit-quiz-btn"
                    >
                      {verifyingQuiz ? 'Checking...' : 'Submit Answers'}
                    </button>
                    
                    <button 
                      type="button"
                      className="cancel-quiz-btn"
                      onClick={() => setShowQuiz(false)}
                      disabled={verifyingQuiz}
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {quizResult && (
                    <div className={`quiz-result ${quizResult.correct ? 'correct' : 'incorrect'}`}>
                      <h4>{quizResult.correct ? '✅ Great work!' : '❌ Some answers were incorrect'}</h4>
                      <p><ReactMarkdown components={markdownComponents}>{quizResult.feedback}</ReactMarkdown></p>
                      {quizResult.score && (
                        <div className="score-display">
                          Score: <span className="score-value">{quizResult.score}/100</span>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              )}
            </div>
          ) : (
            <div className="step-navigation">
              <button 
                className="next-step-button"
                onClick={handleCompleteStep}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Complete & Continue'}
              </button>
            </div>
          )}
          
          <div className="question-section">
            <h3>Have a question?</h3>
            <p className="question-hint">
              Ask for explanations about concepts or help with errors. 
              {sessionData.projectType === 'html+css+js' 
                ? 'For HTML, CSS, or JavaScript issues' 
                : 'For Python or Streamlit issues'}, 
              the AI will provide progressive hints before showing complete solutions.
              <span className="hint-info">
                <i className="hint-icon">ℹ️</i> For error-related questions, you'll receive helpful hints for your first 3 attempts.
                Complete solutions will be provided after 4 attempts on the same step.
              </span>
            </p>
            <form onSubmit={handleAskQuestion} className="question-form">
              <input
                type="text"
                placeholder="Ask the AI about your code..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                disabled={askingQuestion}
              />
              <button 
                type="submit" 
                disabled={askingQuestion || !userQuestion.trim()}
              >
                {askingQuestion ? 'Thinking...' : 'Ask'}
              </button>
            </form>
            
            {aiResponse && (
              <div className="ai-answer">
                <h4>AI Response:</h4>
                <div className="answer-content">
                  <ReactMarkdown components={markdownComponents}>
                    {aiResponse}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="coding-panel">
          <Split
            className="coding-split"
            sizes={[50, 50]}
            minSize={150}
            direction="vertical"
            gutterSize={10}
            gutterAlign="center"
            snapOffset={30}
            cursor="row-resize"
            dragInterval={1}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div className="editor-container">
              <CodeEditor 
                onCodeSubmit={handleCodeSubmit} 
                onCodeChange={handleCodeChange} 
                isLoading={isLoading}
                initialLanguage={
                  sessionData.projectType === 'html+css+js' ? 'html' : 'python'
                }
                projectType={sessionData.projectType}
                currentCode={{
                  html: htmlCode,
                  css: cssCode,
                  javascript: jsCode,
                  python: pythonCode
                }}
              />
            </div>
            
            <div className="output-container">
              <OutputDisplay 
                executionResult={executionResult} 
                isLoading={isLoading}
                error={error}
                combinedHtml={combinedHtml}
              />
            </div>
          </Split>
        </div>
      </Split>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ProjectBuilder;