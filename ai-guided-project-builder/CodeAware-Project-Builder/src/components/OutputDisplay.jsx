import React, { useState, useEffect } from 'react';
import '../styles/OutputDisplay.css';

const OutputDisplay = ({ executionResult, isLoading, error, combinedHtml }) => {
  const [activeTab, setActiveTab] = useState('output');
  const [streamlitUrl, setStreamlitUrl] = useState('');
  
  // Effect to handle Streamlit URL
  useEffect(() => {
    if (executionResult && executionResult.is_streamlit && !executionResult.streamlit_error) {
      setStreamlitUrl(executionResult.streamlit_url);
      // Auto-switch to the Streamlit tab when a Streamlit app is running
      setActiveTab('streamlit');
    } else if (executionResult && executionResult.html_content) {
      // Auto-switch to the render tab when HTML content is available
      setActiveTab('render');
    }
  }, [executionResult]);
  
  // Clear Streamlit URL when results change
  useEffect(() => {
    if (!executionResult || !executionResult.is_streamlit) {
      setStreamlitUrl('');
    }
  }, [executionResult]);

  if (isLoading) {
    return (
      <div className="output-display">
        <div className="output-tabs">
          <button className={`tab-button ${activeTab === 'output' ? 'active' : ''}`} onClick={() => setActiveTab('output')}>
            Output
          </button>
          <button className={`tab-button ${activeTab === 'render' ? 'active' : ''}`} onClick={() => setActiveTab('render')}>
            Render
          </button>
          {streamlitUrl && (
            <button className={`tab-button ${activeTab === 'streamlit' ? 'active' : ''}`} onClick={() => setActiveTab('streamlit')}>
              Streamlit
            </button>
          )}
        </div>
        <div className="tab-content loading">
          <div className="loading-spinner"></div>
          <p>Running your code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="output-display">
      <div className="output-tabs">
        <button className={`tab-button ${activeTab === 'output' ? 'active' : ''}`} onClick={() => setActiveTab('output')}>
          Output
        </button>
        <button className={`tab-button ${activeTab === 'render' ? 'active' : ''}`} onClick={() => setActiveTab('render')}>
          Render
        </button>
        {streamlitUrl && (
          <button className={`tab-button ${activeTab === 'streamlit' ? 'active' : ''}`} onClick={() => setActiveTab('streamlit')}>
            Streamlit
          </button>
        )}
      </div>
      
      {activeTab === 'output' && (
        <div className="tab-content">
          {error ? (
            <div className="error-output">
              <h3>Error</h3>
              <pre>{error}</pre>
            </div>
          ) : executionResult ? (
            <div className="code-output">
              {executionResult.stdout && (
                <div className="stdout">
                  <h3>Output</h3>
                  <pre>{executionResult.stdout}</pre>
                </div>
              )}
              {executionResult.stderr && (
                <div className="stderr">
                  <h3>Errors</h3>
                  <pre>{executionResult.stderr}</pre>
                </div>
              )}
              {!executionResult.stdout && !executionResult.stderr && (
                <div className="info-message">
                  <p>No output to display. Run your code to see results here.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="info-message">
              <p>No output to display. Run your code to see results here.</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'render' && (
        <div className="tab-content">
          {executionResult && executionResult.html_content ? (
            <div className="html-preview">
              <iframe 
                srcDoc={executionResult.html_content || combinedHtml}
                title="HTML Preview" 
                className="preview-iframe"
                sandbox="allow-scripts"
              />
            </div>
          ) : combinedHtml ? (
            <div className="html-preview">
              <iframe 
                srcDoc={combinedHtml}
                title="HTML Preview" 
                className="preview-iframe"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <div className="info-message">
              <p>No HTML content to render. Use HTML, CSS and JavaScript to create content.</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'streamlit' && streamlitUrl && (
        <div className="tab-content">
          <div className="streamlit-preview">
            <iframe
              src={streamlitUrl}
              title="Streamlit App"
              className="streamlit-iframe"
              allow="camera;microphone"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputDisplay; 