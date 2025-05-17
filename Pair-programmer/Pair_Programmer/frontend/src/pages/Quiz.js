import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  useTheme,
  Divider
} from '@mui/material';
import useCodingStore from '../store/codingStore';
import axios from 'axios';

const Quiz = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { taskDescription: task, language } = useCodingStore();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [allQuestionsWithAnswers, setAllQuestionsWithAnswers] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (!task || !language) {
      navigate('/');
      return;
    }

    const generateQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post('http://localhost:8003/api/generate_quiz', {
          task_description: task,
          language: language
        });
        
        if (response.data && response.data.questions) {
          setQuestions(response.data.questions);
          // Store the session ID
          if (response.data.session_id) {
            setSessionId(response.data.session_id);
            console.log("Quiz session ID:", response.data.session_id);
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate quiz';
        setError(errorMessage);
        console.error('Error generating quiz:', err);
      } finally {
        setLoading(false);
      }
    };

    generateQuiz();
  }, [task, language, navigate]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    try {
      // Make sure all questions have answers
      if (Object.keys(answers).length !== questions.length) {
        setError("Please answer all questions before submitting.");
        return;
      }
      
      // Make sure we have a session ID
      if (!sessionId) {
        setError("Quiz session not found. Please refresh the page and try again.");
        return;
      }
      
      // Log the answers for debugging
      console.log("Submitting answers:", answers);
      
      // Send answers to backend with session ID
      const response = await axios.post('http://localhost:8003/api/check_quiz', {
        session_id: sessionId,
        answers: answers
      });

      if (response.data) {
        setScore(response.data.score);
        setWrongAnswers(response.data.wrong_answers || []);
        setShowResults(true);
        setQuizCompleted(true);
        
        // Use question_results if available, otherwise create our own
        if (response.data.question_results) {
          setAllQuestionsWithAnswers(response.data.question_results);
        } else {
          // Create a comprehensive list of all questions with answers
          const questionsWithAnswers = questions.map(question => {
            const isCorrect = response.data.correct_answers?.includes(question.id);
            return {
              ...question,
              userAnswer: answers[question.id],
              is_correct: isCorrect
            };
          });
          setAllQuestionsWithAnswers(questionsWithAnswers);
        }
        
        // Log the results for debugging
        console.log("Quiz results:", response.data);
      }
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to check quiz answers');
    }
  };

  const handleContinue = () => {
    if (score === 10) {
      // Perfect score - go directly to editor
      navigate('/editor', { 
        state: { 
          perfectScore: true,
          taskDescription: task,
          language: language
        } 
      });
    } else {
      // Less than perfect score - go to learning page with wrong answers
      navigate('/learning', { 
        state: { 
          wrongAnswers: wrongAnswers,
          score: score,
          totalQuestions: questions.length,
          sessionId: sessionId,
          taskDescription: task,
          language: language
        } 
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (showResults) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}>
          <Box sx={{
            mb: 4,
            textAlign: 'center',
            background: 'linear-gradient(45deg, #3a7bd5 0%, #00d2ff 100%)',
            p: 4,
            borderRadius: 3,
            color: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <Typography variant="h3" gutterBottom align="center" sx={{ 
              fontWeight: 800,
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}>
              Quiz Results
            </Typography>
            
            <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3, fontWeight: 600 }}>
              Score: {score}/10 ({((score/10) * 100).toFixed(1)}%)
            </Typography>
          </Box>

          {score === 10 ? (
            <Box sx={{ 
              textAlign: 'center', 
              mb: 5,
              p: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #E3FDF5 0%, #FFE6FA 100%)',
              border: '1px solid rgba(0, 178, 0, 0.3)',
              boxShadow: '0 5px 15px rgba(0, 178, 0, 0.1)'
            }}>
              <Typography variant="h4" color="success.main" gutterBottom sx={{ fontWeight: 700 }}>
                Perfect Score! 🎉
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: '#00b200' }}>
                You've demonstrated excellent understanding of the concepts.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                sx={{ 
                  mt: 2,
                  px: 5,
                  py: 1.5,
                  borderRadius: 10,
                  background: 'linear-gradient(45deg, #00b09b, #96c93d)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 6px 15px rgba(0, 178, 0, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00b09b, #96c93d)',
                    boxShadow: '0 8px 20px rgba(0, 178, 0, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Proceed to Coding
              </Button>
            </Box>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              mb: 5,
              p: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #FFF6B7 0%, #F9D29D 100%)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              boxShadow: '0 5px 15px rgba(255, 152, 0, 0.1)'
            }}>
              <Typography variant="h4" color="warning.main" gutterBottom sx={{ fontWeight: 700 }}>
                Let's Learn More
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: '#ff9800' }}>
                You got {score} out of 10 questions correct. Let's improve your understanding!
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                sx={{
                  mt: 2,
                  px: 5,
                  py: 1.5,
                  borderRadius: 10,
                  background: 'linear-gradient(45deg, #FF8008, #FFC837)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 6px 15px rgba(255, 152, 0, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF8008, #FFC837)',
                    boxShadow: '0 8px 20px rgba(255, 152, 0, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Start Learning
              </Button>
            </Box>
          )}
          
          <Typography variant="h5" sx={{ 
            mt: 6, 
            mb: 4, 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #3a7bd5, #6abbff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Question Review
          </Typography>
          
          {allQuestionsWithAnswers.map((question, index) => (
            <Paper 
              key={question.id} 
              sx={{ 
                p: 4, 
                mb: 3, 
                borderRadius: 3,
                borderLeft: question.is_correct 
                  ? '6px solid #4caf50' 
                  : '6px solid #f44336',
                backgroundColor: question.is_correct 
                  ? 'rgba(76, 175, 80, 0.05)' 
                  : 'rgba(244, 67, 54, 0.05)',
                boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                mb: 2,
                color: question.is_correct ? '#2e7d32' : '#c62828'
              }}>
                Question {index + 1}: {question.question}
              </Typography>
              
              {question.code_snippet && (
                <Box 
                  component="pre" 
                  sx={{ 
                    p: 3, 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2,
                    overflowX: 'auto',
                    mb: 3,
                    fontSize: '0.9rem',
                    border: '1px solid #e3e3e3',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
                  }}
                >
                  {question.code_snippet}
                </Box>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2, 
                mt: 3,
                p: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.7)'
              }}>
                <Typography sx={{ fontSize: '1.05rem' }}>
                  <Box component="span" sx={{ 
                    fontWeight: 700, 
                    color: question.is_correct ? 'text.primary' : '#d32f2f',
                    mr: 1
                  }}>
                    Your answer:
                  </Box>
                  {String(question.user_answer || question.userAnswer || "")}
                </Typography>
                
                <Typography sx={{ fontSize: '1.05rem' }}>
                  <Box component="span" sx={{ 
                    fontWeight: 700, 
                    color: question.is_correct ? '#2e7d32' : '#2e7d32',
                    mr: 1
                  }}>
                    Correct answer:
                  </Box>
                  {String(question.correct_answer || "")}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 100%)',
      py: 5
    }}>
      <Container maxWidth="lg">
        <Paper sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
        }}>
          <Box sx={{
            mb: 5,
            textAlign: 'center',
            background: 'linear-gradient(45deg, #764ba2 0%, #667eea 100%)',
            p: 4,
            borderRadius: 3,
            color: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <Typography variant="h3" gutterBottom sx={{ 
              fontWeight: 800,
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}>
              Expert Quiz
            </Typography>
            <Typography variant="h6" sx={{ 
              opacity: 0.9,
              fontWeight: 400,
              maxWidth: '700px',
              mx: 'auto'
            }}>
              Answer all questions to test your understanding of the concepts
            </Typography>
          </Box>

          {questions.map((question, index) => (
            <Paper 
              key={question.id} 
              elevation={4}
              sx={{ 
                mb: 4,
                p: 4,
                borderRadius: 3,
                backgroundColor: 'white',
                boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                }
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ 
                color: '#512da8',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3
              }}>
                <Box 
                  component="span" 
                  sx={{ 
                    backgroundColor: '#512da8',
                    color: 'white',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    boxShadow: '0 3px 5px rgba(0,0,0,0.2)'
                  }}
                >
                  {index + 1}
                </Box>
                {question.question}
              </Typography>

              {question.code_snippet && (
                <Box 
                  sx={{ 
                    p: 0, 
                    mb: 3,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <Box sx={{ 
                    p: 1.5, 
                    backgroundColor: '#2d2d2d',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>code</span>
                    Code Example
                  </Box>
                  <Box 
                    component="pre" 
                    sx={{ 
                      m: 0, 
                      p: 3,
                      backgroundColor: '#f8f9fa',
                      whiteSpace: 'pre-wrap',
                      color: '#2c3e50',
                      overflowX: 'auto',
                      fontFamily: '"Fira Code", "Courier New", monospace',
                      fontSize: '0.9rem'
                    }}
                  >
                    {question.code_snippet}
                  </Box>
                </Box>
              )}

              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                >
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                    {question.options.map((option, optIndex) => (
                      <FormControlLabel
                        key={optIndex}
                        value={option}
                        control={
                          <Radio 
                            sx={{
                              color: '#512da8',
                              '&.Mui-checked': {
                                color: '#512da8',
                              },
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ 
                            color: '#2c3e50',
                            fontWeight: answers[question.id] === option ? 600 : 400
                          }}>
                            {option}
                          </Typography>
                        }
                        sx={{
                          m: 0,
                          p: 2,
                          borderRadius: 2,
                          transition: 'all 0.2s',
                          border: '1px solid',
                          borderColor: answers[question.id] === option ? '#512da8' : '#e0e0e0',
                          '&:hover': {
                            backgroundColor: 'rgba(81, 45, 168, 0.04)',
                            borderColor: '#512da8'
                          },
                          ...(answers[question.id] === option && {
                            backgroundColor: 'rgba(81, 45, 168, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(81, 45, 168, 0.15)'
                            }
                          })
                        }}
                      />
                    ))}
                  </Box>
                </RadioGroup>
              </FormControl>
            </Paper>
          ))}

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 5,
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              size="large"
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#512da8',
                color: '#512da8',
                fontWeight: 600,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#512da8',
                  backgroundColor: 'rgba(81, 45, 168, 0.04)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Back to Home
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length}
              size="large"
              sx={{
                py: 1.5,
                px: 5,
                borderRadius: 10,
                background: 'linear-gradient(45deg, #764ba2 0%, #667eea 100%)',
                fontWeight: 600,
                boxShadow: '0 5px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #764ba2 10%, #667eea 90%)',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.6)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: '#cccccc',
                  boxShadow: 'none'
                }
              }}
            >
              Submit Quiz
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Quiz; 