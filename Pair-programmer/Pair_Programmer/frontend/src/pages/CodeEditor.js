import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import useCodingStore from '../store/codingStore';
import axios from 'axios';
import Editor from '@monaco-editor/react';

const CodeEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const editorRef = useRef(null);
  const { taskDescription: storeTask, difficultyLevel: difficulty, language: storeLanguage, currentCode: code, setCurrentCode: setCode, setOutput, resetState } = useCodingStore();
  const [localCode, setLocalCode] = useState('');
  const [output, setLocalOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [hints, setHints] = useState([]);
  const [expandedHint, setExpandedHint] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  // Get the scenario from location state
  const isPerfectScore = location.state?.perfectScore || false;
  const isFromLearning = location.state?.fromLearning || false;
  const useBoilerplate = location.state?.use_boilerplate || false;
  
  // Get task description and language from location state if available
  const task = location.state?.taskDescription || storeTask;
  const language = location.state?.language || storeLanguage;

  // Handle editor mounting
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!task || !difficulty || !language) {
      navigate('/');
      return;
    }

    const generateScaffolding = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine if we should use boilerplate code
        let shouldUseBoilerplate = false;
        if (difficulty === 'newbie' || isFromLearning) {
          shouldUseBoilerplate = true;
        } else if (difficulty === 'expert' && !isPerfectScore) {
          shouldUseBoilerplate = true;
        }

        const response = await axios.post('http://localhost:8003/api/generate_scaffolding', {
          task_description: task,
          difficulty_level: difficulty,
          language: language,
          use_boilerplate: shouldUseBoilerplate
        });
        
        if (response.data) {
          // Handle scaffolding
          let code = response.data.scaffolding;
          if (typeof code !== 'string') {
            if (Array.isArray(code)) {
              code = code.join('\n');
            } else if (typeof code === 'object') {
              code = JSON.stringify(code, null, 2);
            } else {
              code = String(code);
            }
          }
          code = code.trim();
          setLocalCode(code);
          setCode(code);
          
          // Handle hints - always show hints for newbie mode
          if (difficulty === 'newbie' && response.data.hints) {
            const hintsArray = Array.isArray(response.data.hints) ? response.data.hints : [];
            const formattedHints = hintsArray.map((hint, index) => ({
              id: index + 1,
              content: typeof hint === 'string' ? hint : String(hint),
              expanded: false
            }));
            setHints(formattedHints);
          } else {
            setHints([]);
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error generating scaffolding:', err);
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate code scaffolding';
        setError(errorMessage);
        
        // Set default code template
        const defaultCode = getDefaultCodeTemplate(language);
        setLocalCode(defaultCode);
        setCode(defaultCode);
        setHints([]);
      } finally {
        setLoading(false);
      }
    };

    generateScaffolding();
  }, [task, difficulty, language, navigate, setCode, isPerfectScore, isFromLearning]);

  const handleHintClick = (hintId) => {
    setExpandedHint(expandedHint === hintId ? null : hintId);
  };

  // Helper function to get default code template
  const getDefaultCodeTemplate = (lang) => {
    const templates = {
      python: '# Write your Python code here\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()',
      javascript: '// Write your JavaScript code here\n\nfunction main() {\n    // Your code here\n}\n\nmain();',
      java: '// Write your Java code here\n\npublic class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
      cpp: '// Write your C++ code here\n\n#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}',
      csharp: '// Write your C# code here\n\nusing System;\n\nclass Program {\n    static void Main(string[] args) {\n        // Your code here\n    }\n}',
      go: '// Write your Go code here\n\npackage main\n\nfunc main() {\n    // Your code here\n}',
      rust: '// Write your Rust code here\n\nfn main() {\n    // Your code here\n}',
      php: '<?php\n// Write your PHP code here\n\nfunction main() {\n    // Your code here\n}\n\nmain();\n?>',
      ruby: '# Write your Ruby code here\n\ndef main\n    # Your code here\nend\n\nmain',
      swift: '// Write your Swift code here\n\nimport Foundation\n\nfunc main() {\n    // Your code here\n}\n\nmain()'
    };
    return templates[lang] || '// Write your code here';
  };

  const handleRunCode = async () => {
    try {
      setExecuting(true);
      setLocalOutput('');
      setError(null);
      
      // Ensure code is a string before sending
      const codeToRun = typeof localCode === 'string' ? localCode : String(localCode);
      
      const response = await axios.post('http://localhost:8003/api/run_code', {
        code: codeToRun,
        language: language
      });
      
      if (response.data && response.data.output !== undefined) {
        const output = String(response.data.output);
        setLocalOutput(output);
        setOutput(output);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error running code:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to execute code';
      setLocalOutput(errorMessage);
      setError(errorMessage);
    } finally {
      setExecuting(false);
    }
  };

  const handleAnalyzeCode = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      // Ensure code is a string before sending
      const codeToAnalyze = typeof localCode === 'string' ? localCode : String(localCode);
      
      const response = await axios.post('http://localhost:8003/api/analyze_code', {
        code: codeToAnalyze,
        language: language,
        task_description: task
      });
      
      if (response.data && response.data.analysis) {
        // Store analysis result, ensuring it's a string
        const result = response.data.analysis;
        const sanitizedResult = typeof result === 'string' 
          ? result 
          : typeof result === 'object' 
            ? JSON.stringify(result) 
            : String(result);
            
        setAnalysisResult(sanitizedResult);
        setShowAnalysisDialog(true);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error analyzing code:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to analyze code';
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBack = () => {
    resetState();
    navigate('/');
  };

  const handleEditorChange = (value) => {
    if (value !== undefined) {
      setLocalCode(value);
      setCode(value);
    }
  };

  // Add dialog to display analysis results
  const AnalysisDialog = () => {
    return (
      <Dialog
        open={showAnalysisDialog}
        onClose={() => setShowAnalysisDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #673AB7 30%, #9C27B0 90%)',
          color: 'white',
          fontWeight: 'bold',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <span className="material-icons" style={{ fontSize: '1.8rem' }}>psychology</span>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Code Analysis Results
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setShowAnalysisDialog(false)}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <span className="material-icons">close</span>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {analyzing ? (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexDirection: 'column',
              p: 5,
              minHeight: '300px',
              gap: 3
            }}>
              <CircularProgress size={60} />
              <Typography variant="h6">
                Analyzing your code...
              </Typography>
            </Box>
          ) : (
            <Box>
              {analysisResult && (
                <Box>
                  <Box sx={{
                    p: 4,
                    backgroundColor: analysisResult.includes('Great job') || 
                                    analysisResult.includes('well done') || 
                                    analysisResult.includes('correct') ? 
                      'rgba(76, 175, 80, 0.1)' : 
                      'rgba(255, 152, 0, 0.1)'
                  }}>
                    <Box 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        fontFamily: 'inherit',
                        '& ul': { pl: 3 },
                        '& li': { mb: 1 },
                        fontSize: '1rem',
                        lineHeight: 1.7,
                        color: '#333'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: String(analysisResult || "")
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/```([\s\S]*?)```/g, '<pre style="background-color: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; margin: 16px 0; font-family: monospace;">$1</pre>')
                          .replace(/`(.*?)`/g, '<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  </Box>

                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={() => setShowAnalysisDialog(false)}
                      sx={{
                        py: 1,
                        px: 4,
                        borderRadius: 10,
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: analysisResult.includes('Great job') || 
                                   analysisResult.includes('well done') || 
                                   analysisResult.includes('correct') ?
                          'linear-gradient(45deg, #4CAF50 30%, #43A047 90%)' :
                          'linear-gradient(45deg, #FF8008, #FFC837)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
                        }
                      }}
                    >
                      {analysisResult.includes('Great job') || 
                       analysisResult.includes('well done') || 
                       analysisResult.includes('correct') ?
                        'Awesome!' : 'Got It'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: 3,
        background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)'
      }}>
        <CircularProgress size={80} thickness={4} sx={{ color: 'white' }} />
        <Typography variant="h4" sx={{
          color: 'white',
          fontWeight: 700,
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Preparing your coding environment...
        </Typography>
        <Typography variant="h6" sx={{
          color: 'white',
          opacity: 0.9,
          fontWeight: 400,
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          Loading code scaffolding and editor components
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1c92d2 0%, #f2fcfe 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: { xs: 3, md: 0 },
          background: 'linear-gradient(45deg, #3a7bd5 0%, #00d2ff 100%)',
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          color: 'white',
          boxShadow: '0 10px 30px rgba(0, 210, 255, 0.3)'
        }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ 
              fontWeight: 800,
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}>
              Code Editor
            </Typography>
            <Typography variant="h6" sx={{ 
              mt: 1,
              fontWeight: 400,
              opacity: 0.9,
              maxWidth: '700px'
            }}>
              {difficulty === 'newbie' ? 'Newbie Mode: Complete the TODOs' : 'Expert Mode: Full Implementation'}
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={handleBack}
            size="large"
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: '#3a7bd5',
              px: 4,
              py: 1.5,
              borderRadius: 10,
              fontWeight: 600,
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: 'white',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Back to Home
          </Button>
        </Box>

        <Paper sx={{ 
          p: { xs: 3, md: 4 }, 
          mb: 4, 
          borderRadius: 3, 
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)'
        }}>
          <Typography variant="h5" gutterBottom sx={{ 
            color: '#3a7bd5', 
            fontWeight: 700,
            borderBottom: '2px solid #3a7bd5',
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <span className="material-icons">assignment</span>
            Task Description
          </Typography>
          <Typography variant="body1" sx={{ 
            mb: 3, 
            fontSize: '1.1rem',
            color: '#2c3e50',
            lineHeight: 1.7
          }}>
            {task || 'No task selected'}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            backgroundColor: 'rgba(242, 245, 250, 0.8)',
            p: 2,
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#2c3e50', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <span className="material-icons">flag</span>
              Difficulty:
            </Typography>
            <Box
              sx={{ 
                backgroundColor: difficulty === 'newbie' ? '#4caf50' : '#ff9800',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 5,
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <span className="material-icons" style={{ fontSize: '1.2rem' }}>
                {difficulty === 'newbie' ? 'emoji_objects' : 'psychology'}
              </span>
              {difficulty === 'newbie' ? 'Newbie' : 'Expert'}
            </Box>
          </Box>
        </Paper>

        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 2, 
          mb: 4,
          alignItems: 'center',
          p: 3,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Programming Language</InputLabel>
            <Select
              value={language}
              label="Programming Language"
              onChange={(e) => {
                setLocalCode('');
                setCode('');
                setLocalOutput('');
                setOutput('');
                useCodingStore.getState().setLanguage(e.target.value);
              }}
              sx={{ 
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              <MenuItem value="python">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>🐍</span>
                  Python
                </Box>
              </MenuItem>
              <MenuItem value="javascript">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>📜</span>
                  JavaScript
                </Box>
              </MenuItem>
              <MenuItem value="java">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>☕</span>
                  Java
                </Box>
              </MenuItem>
              <MenuItem value="cpp">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                  C++
                </Box>
              </MenuItem>
              <MenuItem value="csharp">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>#️⃣</span>
                  C#
                </Box>
              </MenuItem>
              <MenuItem value="go">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>🔹</span>
                  Go
                </Box>
              </MenuItem>
              <MenuItem value="rust">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>🦀</span>
                  Rust
                </Box>
              </MenuItem>
              <MenuItem value="php">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>🐘</span>
                  PHP
                </Box>
              </MenuItem>
              <MenuItem value="ruby">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>💎</span>
                  Ruby
                </Box>
              </MenuItem>
              <MenuItem value="swift">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.2rem' }}>🦅</span>
                  Swift
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            ml: 'auto' 
          }}>
            <Button 
              variant="contained" 
              onClick={handleAnalyzeCode} 
              disabled={analyzing || !localCode}
              sx={{ 
                px: 3,
                py: 1.5,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(45deg, #673AB7 30%, #9C27B0 90%)',
                boxShadow: '0 4px 12px rgba(103, 58, 183, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #673AB7 30%, #9C27B0 90%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 15px rgba(103, 58, 183, 0.4)'
                },
                '&:disabled': {
                  background: '#cccccc',
                  boxShadow: 'none'
                },
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <span className="material-icons" style={{ fontSize: '1.3rem' }}>
                {analyzing ? 'hourglass_top' : 'psychology'}
              </span>
              {analyzing ? 'Analyzing...' : 'Analyze Code'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ 
              p: 0, 
              mb: 4, 
              borderRadius: 3, 
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: '#252526', 
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography sx={{ 
                  fontSize: '1rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <span className="material-icons" style={{ fontSize: '1.2rem' }}>code</span>
                  {language.charAt(0).toUpperCase() + language.slice(1)} Code Editor
                </Typography>
                <Typography sx={{ 
                  fontSize: '0.8rem',
                  opacity: 0.8,
                  fontStyle: 'italic'
                }}>
                  Write your solution here
                </Typography>
              </Box>
              <Box sx={{ height: '500px' }}>
                <Editor
                  height="100%"
                  defaultLanguage={language}
                  value={localCode}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    roundedSelection: true,
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'visible',
                      useShadows: true,
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10
                    }
                  }}
                />
              </Box>
            </Paper>

            {output && (
              <Paper sx={{ 
                p: 0, 
                mb: 4, 
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                background: 'white'
              }}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#333333', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <span className="material-icons">terminal</span>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Output
                  </Typography>
                </Box>
                <Box 
                  component="pre" 
                  sx={{ 
                    margin: 0, 
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#1e1e1e',
                    p: 3,
                    borderRadius: 0,
                    fontFamily: '"Fira Code", "Courier New", monospace',
                    fontSize: '0.9rem',
                    color: '#00ff00',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}
                >
                  {output}
                </Box>
              </Paper>
            )}

            {error && (
              <Paper sx={{ 
                p: 0, 
                mb: 4, 
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                background: 'white'
              }}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#d32f2f', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <span className="material-icons">error</span>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Error
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 3,
                  backgroundColor: '#ffebee'
                }}>
                  <Typography sx={{ 
                    color: '#d32f2f',
                    whiteSpace: 'pre-wrap',
                    fontFamily: '"Fira Code", "Courier New", monospace',
                    fontSize: '0.9rem'
                  }}>
                    {error}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>

          {difficulty === 'newbie' && hints.length > 0 && (
            <Box sx={{ width: { xs: '100%', lg: '320px' } }}>
              <Paper sx={{ 
                p: 0, 
                borderRadius: 3, 
                overflow: 'hidden',
                boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                background: 'white',
                position: 'sticky',
                top: '20px'
              }}>
                <Box sx={{ 
                  p: 2,
                  backgroundColor: '#3f51b5',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <span className="material-icons">lightbulb</span>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Helpful Hints
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  {hints.map((hint) => (
                    <Accordion 
                      key={hint.id}
                      expanded={expandedHint === hint.id}
                      onChange={() => handleHintClick(hint.id)}
                      sx={{
                        mb: 2,
                        '&:before': { display: 'none' },
                        boxShadow: 'none',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px !important',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#3f51b5',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        },
                        '&.Mui-expanded': {
                          margin: '0 0 16px 0',
                          backgroundColor: '#f5f5f5'
                        }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <span className="material-icons">expand_more</span>
                        }
                        sx={{
                          minHeight: '48px',
                          borderLeft: '4px solid #3f51b5',
                          '&.Mui-expanded': {
                            minHeight: '48px',
                            backgroundColor: 'rgba(63, 81, 181, 0.08)'
                          }
                        }}
                      >
                        <Typography sx={{ 
                          fontWeight: 600,
                          color: '#3f51b5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <span className="material-icons" style={{ fontSize: '1.1rem' }}>lightbulb</span>
                          Hint {hint.id}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 3, backgroundColor: 'white' }}>
                        <Typography variant="body1" sx={{ 
                          color: '#333',
                          lineHeight: 1.6
                        }}>
                          {hint.content}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Analysis Dialog */}
        <AnalysisDialog />
      </Container>
    </Box>
  );
};

export default CodeEditor; 