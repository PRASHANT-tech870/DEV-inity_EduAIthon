import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/WelcomeScreen.css';
import { BASE_URL } from './apiconfig';

import AlgorithmDesigner from './AlgorithmDesigner';

const WelcomeScreen = ({ onProjectStart }) => {
  const [projectType, setProjectType] = useState('');
  const [expertiseLevel, setExpertiseLevel] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [animatedText, setAnimatedText] = useState('');
  const [showAlgorithmDesigner, setShowAlgorithmDesigner] = useState(false);

  // Text typing animation effect
  const targetText = "Build, Learn, Code.";
  
  useEffect(() => {
    let currentIndex = 0;
    let timerId;
    
    const typeNextChar = () => {
      if (currentIndex <= targetText.length) {
        setAnimatedText(targetText.slice(0, currentIndex));
        currentIndex++;
        timerId = setTimeout(typeNextChar, 100);
      } else {
        // Reset after a delay
        setTimeout(() => {
          currentIndex = 0;
          timerId = setTimeout(typeNextChar, 100);
        }, 3000);
      }
    };
    
    timerId = setTimeout(typeNextChar, 500);
    
    return () => clearTimeout(timerId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectType || !expertiseLevel) {
      setError('Please select both project type and expertise level');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${BASE_URL}/start_project`, {
        project_type: projectType,
        expertise_level: expertiseLevel,
        project_idea: projectIdea || undefined
      });
      
      const { session_id, response: geminiResponse } = response.data;
      
      // Pass the data back to parent component
      onProjectStart({
        sessionId: session_id,
        projectType,
        expertiseLevel,
        projectIdea: projectIdea || 'AI suggested project',
        geminiResponse
      });
    } catch (err) {
      console.error('Error starting project:', err);
      setError('Failed to start project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="animated-background"></div>
      <div className="welcome-container">
        <div className="logo-section">
          <div className="app-logo">EduAIthon</div>
          <div className="tagline">AI-Powered Coding Education</div>
          <div className="action-buttons">
            <button 
              className="algorithm-designer-button" 
              onClick={() => setShowAlgorithmDesigner(true)}
            >
              <span className="icon">🧩</span>
              Design Algorithm First
            </button>
          </div>
        </div>
        
        <div className="welcome-header">
          <h1>Build Real-World Projects with AI Guidance</h1>
          <div className="animated-text">{animatedText}<span className="cursor">|</span></div>
          <p>
            Choose your tech stack, specify your expertise level, and start building projects with 
            step-by-step AI assistance tailored to your learning needs.
          </p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-section">
            <h2>Choose Your Technology</h2>
            
            <div className="tech-choices">
              <div className="tech-choice">
                <input 
                  type="radio" 
                  id="python-streamlit" 
                  name="projectType" 
                  value="python+streamlit"
                  checked={projectType === 'python+streamlit'}
                  onChange={() => setProjectType('python+streamlit')}
                />
                <label htmlFor="python-streamlit">
                  <div className="tech-icon">🐍</div>
                  <div className="tech-name">Python + Streamlit</div>
                  <div className="tech-desc">Build data-focused web applications with Python</div>
                </label>
              </div>
              
              <div className="tech-choice">
                <input 
                  type="radio" 
                  id="html-css-js" 
                  name="projectType" 
                  value="html+css+js"
                  checked={projectType === 'html+css+js'}
                  onChange={() => setProjectType('html+css+js')}
                />
                <label htmlFor="html-css-js">
                  <div className="tech-icon">🌐</div>
                  <div className="tech-name">HTML + CSS + JS</div>
                  <div className="tech-desc">Create interactive websites with web technologies</div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Your Experience Level</h2>
            
            <div className="skill-levels">
              <div className="skill-level">
                <input 
                  type="radio" 
                  id="beginner" 
                  name="expertiseLevel" 
                  value="beginner"
                  checked={expertiseLevel === 'beginner'}
                  onChange={() => setExpertiseLevel('beginner')}
                />
                <label htmlFor="beginner">
                  <div className="skill-icon">🔰</div>
                  <div className="skill-name">Absolute Beginner</div>
                  <p>I'm new to this technology</p>
                </label>
              </div>
              
              <div className="skill-level">
                <input 
                  type="radio" 
                  id="intermediate" 
                  name="expertiseLevel" 
                  value="intermediate"
                  checked={expertiseLevel === 'intermediate'}
                  onChange={() => setExpertiseLevel('intermediate')}
                />
                <label htmlFor="intermediate">
                  <div className="skill-icon">⚙️</div>
                  <div className="skill-name">Intermediate</div>
                  <p>I've built some small projects</p>
                </label>
              </div>
              
              <div className="skill-level">
                <input 
                  type="radio" 
                  id="expert" 
                  name="expertiseLevel" 
                  value="expert"
                  checked={expertiseLevel === 'expert'}
                  onChange={() => setExpertiseLevel('expert')}
                />
                <label htmlFor="expert">
                  <div className="skill-icon">🚀</div>
                  <div className="skill-name">Expert</div>
                  <p>I'm comfortable with advanced concepts</p>
                </label>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Project Idea (Optional)</h2>
            
            <div className="form-group">
              <textarea
                placeholder="Describe your project idea, or leave blank for AI suggestions..."
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                rows="3"
              />
              
              <div className="algorithm-prompt">
                <span className="algorithm-tip">
                  💡 Need help planning your project logic first?
                  <button 
                    type="button" 
                    className="open-algorithm-btn"
                    onClick={() => setShowAlgorithmDesigner(true)}
                  >
                    Design Algorithm
                  </button>
                </span>
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="start-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                <span className="button-text">Creating your project...</span>
              </>
            ) : (
              <span className="button-text">Start Building</span>
            )}
          </button>
        </form>
        
        <div className="features-section">
          <div className="feature">
            <div className="feature-icon">💡</div>
            <div className="feature-title">AI-Guided Learning</div>
            <p>Get intelligent hints and solutions as you code</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🛠️</div>
            <div className="feature-title">Real-Time Feedback</div>
            <p>Test your code instantly in the browser</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📈</div>
            <div className="feature-title">Progressive Projects</div>
            <p>Build complexity as you learn at your own pace</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🧩</div>
            <div className="feature-title">Algorithm Designer</div>
            <p>Plan your project logic before writing code</p>
          </div>
        </div>
      </div>

      {showAlgorithmDesigner && (
        <AlgorithmDesigner onClose={() => setShowAlgorithmDesigner(false)} />
      )}
    </div>
  );
};

export default WelcomeScreen; 