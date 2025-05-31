import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Chip
} from '@mui/material';
// Import icons directly to avoid forwarded refs
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useCodingStore from '../store/codingStore';
import axios from 'axios';

// Simple component to render icons safely
const SafeIcon = ({ iconType }) => {
  switch (iconType) {
    case 'error':
      return <span className="material-icons" style={{ color: '#f44336', marginRight: '8px' }}>error_outline</span>;
    case 'school':
      return <span className="material-icons" style={{ color: '#2196F3', marginRight: '8px' }}>school</span>;
    case 'code':
      return <span className="material-icons" style={{ color: '#FF9800', marginRight: '8px' }}>code</span>;
    case 'expand_more':
      return <span className="material-icons">expand_more</span>;
    default:
      return null;
  }
};

const Learning = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { taskDescription: storeTask, language: storeLanguage } = useCodingStore();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [learningData, setLearningData] = useState({
    sections: [],
    wrongAnswers: [],
    conceptKeywords: []
  });
  
  // Get data from location state (passed from Quiz)
  const wrongAnswers = location.state?.wrongAnswers || [];
  const score = location.state?.score || 0;
  const totalQuestions = location.state?.totalQuestions || 0;
  const taskDescription = location.state?.taskDescription || storeTask;
  const language = location.state?.language || storeLanguage;

  useEffect(() => {
    // Redirect to home if no task description or language
    if (!taskDescription || !language) {
      navigate('/');
      return;
    }

    const fetchLearningContent = async () => {
      try {
        setLoading(true);
        
        // Format wrong answers for API
        const wrongAnswerData = wrongAnswers.map(item => ({
          question: item.question,
          user_answer: item.user_answer,
          correct_answer: item.correct_answer,
          code_snippet: item.code_snippet || ""
        }));
        
        console.log("Sending request to generate learning content:", {
          task_description: taskDescription,
          language,
          wrong_answers: wrongAnswerData
        });
        
        const response = await axios.post(`${BASE_URL}/api/generate_learning`, {
          task_description: taskDescription,
          language,
          wrong_answers: wrongAnswerData
        });
        
        console.log("Received learning content response:", response.data);
        
        if (response.data && response.data.content) {
          const content = response.data.content;
          
          // Process and store the data
          setLearningData({
            sections: Array.isArray(content.sections) ? content.sections : [],
            wrongAnswers: Array.isArray(content.wrong_answers) ? content.wrong_answers : [],
            conceptKeywords: Array.isArray(content.concept_keywords) ? content.concept_keywords : []
          });
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (err) {
        console.error("Error fetching learning content:", err);
        setError(err.response?.data?.detail || err.message || "Failed to load learning content");
      } finally {
        setLoading(false);
      }
    };

    fetchLearningContent();
  }, [taskDescription, language, wrongAnswers, navigate]);

  const handleStartCoding = () => {
    navigate('/editor', {
      state: {
        perfectScore: false,
        fromLearning: true,
        concept_keywords: learningData.conceptKeywords,
        taskDescription: taskDescription,
        language: language
      }
    });
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: 3,
        background: 'linear-gradient(135deg, #FFAFBD 0%, #ffc3a0 100%)'
      }}>
        <CircularProgress size={80} thickness={4} sx={{ color: 'white' }} />
        <Typography variant="h4" sx={{
          color: 'white',
          fontWeight: 700,
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          Generating personalized learning content...
        </Typography>
        <Typography variant="h6" sx={{
          color: 'white',
          opacity: 0.9,
          fontWeight: 400,
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          We're crafting a tailored learning path based on your quiz results
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%)',
        p: 4
      }}>
        <Container maxWidth="md">
          <Paper sx={{ 
            p: 5, 
            borderRadius: 3, 
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)'
          }}>
            <Typography variant="h4" sx={{ 
              mb: 3, 
              color: '#e91e63',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              Oops! Something went wrong
            </Typography>
            <Alert 
              severity="error"
              variant="filled"
              sx={{ mb: 3, fontSize: '1.1rem' }}
              action={
                <Button 
                  color="inherit" 
                  size="large"
                  variant="outlined"
                  onClick={() => navigate('/')}
                  sx={{ 
                    borderColor: 'white',
                    fontWeight: 600,
                    '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Go Back
                </Button>
              }
            >
              {error}
            </Alert>
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => window.location.reload()}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: 10,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)',
                  boxShadow: '0 6px 15px rgba(221, 36, 118, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF512F 20%, #DD2476 90%)',
                    boxShadow: '0 8px 20px rgba(221, 36, 118, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Try Again
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFAFBD 0%, #ffc3a0 100%)',
      py: 5
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper 
          elevation={24}
          sx={{ 
            mb: 5, 
            p: { xs: 3, md: 5 },
            background: 'linear-gradient(45deg, #FF9966 0%, #FF5E62 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 10px 30px rgba(255, 94, 98, 0.3)'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: { xs: 3, md: 0 }
          }}>
            <Box>
              <Typography variant="h2" component="h1" sx={{ 
                fontWeight: 800,
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                mb: 1
              }}>
                Personalized Learning
              </Typography>
              <Typography variant="h5" sx={{ 
                fontWeight: 400,
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                opacity: 0.9
              }}>
                Score: {score}/{totalQuestions} ({((score/totalQuestions) * 100).toFixed(1)}%)
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              size="large"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: '#FF5E62',
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
        </Paper>

        {/* Wrong Answers Review */}
        {wrongAnswers.length > 0 && (
          <Paper 
            elevation={8} 
            sx={{ 
              mb: 5, 
              p: { xs: 3, md: 5 }, 
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 4, 
              pb: 2,
              borderBottom: '2px solid rgba(244, 67, 54, 0.3)'
            }}>
              <SafeIcon iconType="error" />
              <Typography variant="h4" sx={{ 
                color: theme.palette.error.main,
                fontWeight: 700
              }}>
                Questions to Review
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              {wrongAnswers.map((wrongAnswer, index) => {
                // Find matching explanation if available
                const explanation = learningData.wrongAnswers[index];
                
                return (
                  <Accordion 
                    key={index}
                    sx={{ 
                      mb: 3,
                      '&:before': { display: 'none' },
                      borderRadius: '12px !important',
                      overflow: 'hidden',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<SafeIcon iconType="expand_more" />}
                      sx={{ 
                        backgroundColor: 'rgba(244, 67, 54, 0.08)',
                        borderLeft: '6px solid #f44336',
                        py: 1.5,
                        px: 3
                      }}
                    >
                      <Typography sx={{ 
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        color: '#d32f2f'
                      }}>
                        Question {index + 1}: {String(wrongAnswer.question || "")}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 4, backgroundColor: 'white' }}>
                      {wrongAnswer.code_snippet && (
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="subtitle1" gutterBottom sx={{ 
                            fontWeight: 600,
                            color: '#424242',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2
                          }}>
                            <span className="material-icons" style={{ fontSize: '1.2rem' }}>code</span>
                            Code Snippet
                          </Typography>
                          <Box 
                            component="pre" 
                            sx={{ 
                              p: 3, 
                              backgroundColor: '#f8f9fa', 
                              borderRadius: 2,
                              overflowX: 'auto',
                              fontSize: '0.9rem',
                              border: '1px solid #e0e0e0',
                              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.05)',
                              fontFamily: '"Fira Code", "Courier New", monospace'
                            }}
                          >
                            {String(wrongAnswer.code_snippet)}
                          </Box>
                        </Box>
                      )}
                      
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 3, 
                        mb: 4,
                        p: 3,
                        borderRadius: 2,
                        backgroundColor: 'rgba(250,250,250,0.7)',
                        border: '1px solid #e0e0e0'
                      }}>
                        <Typography sx={{ fontSize: '1.05rem' }}>
                          <Box component="span" sx={{ 
                            fontWeight: 700, 
                            color: '#d32f2f',
                            mr: 1,
                            display: 'inline-block',
                            minWidth: '120px'
                          }}>
                            Your answer:
                          </Box>
                          {" " + String(wrongAnswer.user_answer || "")}
                        </Typography>
                        <Typography sx={{ fontSize: '1.05rem' }}>
                          <Box component="span" sx={{ 
                            fontWeight: 700, 
                            color: '#2e7d32',
                            mr: 1,
                            display: 'inline-block',
                            minWidth: '120px' 
                          }}>
                            Correct answer:
                          </Box>
                          {" " + String(wrongAnswer.correct_answer || "")}
                        </Typography>
                      </Box>
                      
                      {/* Explanation section */}
                      {explanation && (
                        <Box sx={{ mt: 4 }}>
                          <Typography variant="h6" gutterBottom sx={{
                            fontWeight: 700,
                            color: '#424242'
                          }}>
                            Explanation
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            mb: 3,
                            lineHeight: 1.7,
                            color: '#424242',
                            fontSize: '1rem'
                          }}>
                            {String(explanation.explanation || "No explanation available.")}
                          </Typography>
                          
                          {explanation.visual_explanation && 
                          explanation.visual_explanation.type !== "none" && 
                          explanation.visual_explanation.content && (
                            <Box sx={{ 
                              mt: 3, 
                              p: 3, 
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #e0e0e0',
                              borderRadius: 2,
                              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.05)'
                            }}>
                              <Typography variant="subtitle1" gutterBottom sx={{
                                fontWeight: 600,
                                color: '#424242',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2
                              }}>
                                <span className="material-icons" style={{ fontSize: '1.2rem' }}>auto_awesome</span>
                                Visual Explanation:
                              </Typography>
                              <Box component="pre" sx={{ 
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                                fontFamily: '"Fira Code", "Courier New", monospace',
                                fontSize: '0.9rem'
                              }}>
                                {String(explanation.visual_explanation.content)}
                              </Box>
                            </Box>
                          )}
                          
                          {/* Concept keywords */}
                          {explanation.concept_keywords && explanation.concept_keywords.length > 0 && (
                            <Box sx={{ mt: 4 }}>
                              <Typography variant="subtitle1" gutterBottom sx={{
                                fontWeight: 600,
                                color: '#424242',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2
                              }}>
                                <span className="material-icons" style={{ fontSize: '1.2rem' }}>label</span>
                                Related Concepts:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {explanation.concept_keywords.map((keyword, idx) => (
                                  <Chip 
                                    key={idx} 
                                    label={String(keyword)} 
                                    size="medium"
                                    sx={{
                                      background: 'linear-gradient(45deg, #3a7bd5 0%, #00d2ff 100%)',
                                      color: 'white',
                                      fontWeight: 500,
                                      px: 1
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* Learning Content */}
        {learningData.sections.length > 0 && (
          <Paper 
            elevation={8} 
            sx={{ 
              mb: 5, 
              p: { xs: 3, md: 5 }, 
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 4, 
              pb: 2,
              borderBottom: '2px solid rgba(33, 150, 243, 0.3)'
            }}>
              <SafeIcon iconType="school" />
              <Typography variant="h4" sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700
              }}>
                Learning Content
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              {learningData.sections.map((section, index) => (
                <Accordion 
                  key={index}
                  defaultExpanded={index === 0}
                  sx={{ 
                    mb: 3,
                    '&:before': { display: 'none' },
                    borderRadius: '12px !important',
                    overflow: 'hidden',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<SafeIcon iconType="expand_more" />}
                    sx={{ 
                      backgroundColor: 'rgba(33, 150, 243, 0.08)',
                      borderLeft: '6px solid #2196F3',
                      py: 1.5,
                      px: 3
                    }}
                  >
                    <Typography sx={{ 
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: '#1976d2'
                    }}>
                      {String(section.title || `Section ${index + 1}`)}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 4, backgroundColor: 'white' }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mb: 4,
                        lineHeight: 1.7,
                        color: '#424242',
                        fontSize: '1rem'
                      }}
                    >
                      {String(section.content || "No content available.")}
                    </Typography>
                    
                    {section.code && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ 
                          fontWeight: 600,
                          color: '#424242',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2
                        }}>
                          <span className="material-icons" style={{ fontSize: '1.2rem' }}>code</span>
                          Code Example
                        </Typography>
                        <Box 
                          component="pre" 
                          sx={{ 
                            p: 3, 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: 2,
                            overflowX: 'auto',
                            fontSize: '0.9rem',
                            border: '1px solid #e0e0e0',
                            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.05)',
                            fontFamily: '"Fira Code", "Courier New", monospace'
                          }}
                        >
                          {String(section.code)}
                        </Box>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Paper>
        )}

        {/* Concept Keywords Summary */}
        {learningData.conceptKeywords.length > 0 && (
          <Paper 
            elevation={8} 
            sx={{ 
              mb: 5, 
              p: { xs: 3, md: 4 }, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 20%)',
              boxShadow: '0 8px 25px rgba(255, 94, 98, 0.3)'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3, 
              color: 'white'
            }}>
              <SafeIcon iconType="code" />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Concepts to Focus On
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255,255,255,0.9)',
              mb: 3,
              fontWeight: 400
            }}>
              When you start coding, you'll need to implement these concepts yourself:
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              mt: 3
            }}>
              {learningData.conceptKeywords.map((keyword, index) => (
                <Chip
                  key={index}
                  label={String(keyword)}
                  sx={{ 
                    borderRadius: '50px',
                    py: 2.5,
                    px: 1,
                    fontSize: '1rem',
                    fontWeight: 600,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: '#ff5e62',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      backgroundColor: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* Start Coding Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartCoding}
            sx={{
              py: 2,
              px: 6,
              fontSize: '1.3rem',
              borderRadius: 10,
              fontWeight: 700,
              background: 'linear-gradient(45deg, #02AABB 30%, #00CDAC 90%)',
              boxShadow: '0 8px 25px rgba(0, 205, 172, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #02AABB 30%, #00CDAC 90%)',
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 30px rgba(0, 205, 172, 0.6)'
              }
            }}
          >
            <span className="material-icons" style={{ marginRight: '12px', fontSize: '1.6rem' }}>code</span>
            Start Coding
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Learning; 