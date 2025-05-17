import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Grid,
  Avatar,
  useMediaQuery
} from '@mui/material';
import useCodingStore from '../store/codingStore';

const TaskSelection = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { setTaskDescription, setDifficultyLevel, setLanguage } = useCodingStore();
  const [task, setTask] = useState('');
  const [familiarity, setFamiliarity] = useState('newbie');
  const [language, setLocalLanguage] = useState('python');

  const handleSubmit = (e) => {
    e.preventDefault();
    setTaskDescription(task);
    setDifficultyLevel(familiarity);
    setLanguage(language);
    
    // Navigate based on familiarity level
    if (familiarity === 'expert') {
      navigate('/quiz');
    } else {
      navigate('/editor');
    }
  };

  // Language icons and colors
  const languageInfo = {
    python: { color: '#3776AB', icon: '🐍' },
    javascript: { color: '#F7DF1E', icon: '📜' },
    java: { color: '#007396', icon: '☕' },
    cpp: { color: '#00599C', icon: '⚙️' },
    csharp: { color: '#239120', icon: '#️⃣' },
    go: { color: '#00ADD8', icon: '🔹' },
    rust: { color: '#B7410E', icon: '🦀' },
    php: { color: '#777BB4', icon: '🐘' },
    ruby: { color: '#CC342D', icon: '💎' },
    swift: { color: '#FA7343', icon: '🦅' }
  };

  const backgroundGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: backgroundGradient,
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Hero content */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ color: 'white', pr: 4 }}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  mb: 3,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Master Coding Challenges
              </Typography>
              
              <Typography 
                variant="h5"
                sx={{ 
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 300,
                  lineHeight: 1.5
                }}
              >
                Enhance your programming skills with personalized learning paths
                and interactive challenges.
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2, 
                my: 4 
              }}>
                {Object.entries(languageInfo).map(([lang, info]) => (
                  <Avatar 
                    key={lang}
                    sx={{ 
                      width: 50, 
                      height: 50,
                      fontSize: '1.5rem',
                      backgroundColor: info.color,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.15)'
                      }
                    }}
                  >
                    {info.icon}
                  </Avatar>
                ))}
              </Box>
            </Box>
          </Grid>
          
          {/* Right side - Form */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={24} 
              sx={{ 
                p: { xs: 3, md: 5 }, 
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 15px 25px rgba(0,0,0,0.2)'
              }}
            >
              <Typography 
                variant="h4" 
                align="center"
                sx={{ 
                  background: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  mb: 3
                }}
              >
                Code Learning Platform
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="What would you like to learn today?"
                  placeholder="e.g., Implement a sorting algorithm, Create a React component, Build a REST API..."
                  multiline
                  rows={4}
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                      backgroundColor: 'white'
                    }
                  }}
                />

                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Familiarity Level</InputLabel>
                      <Select
                        value={familiarity}
                        label="Familiarity Level"
                        onChange={(e) => setFamiliarity(e.target.value)}
                        required
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: 'white'
                        }}
                      >
                        <MenuItem value="newbie">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>🌱</span>
                            Newbie Mode
                          </Box>
                        </MenuItem>
                        <MenuItem value="expert">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>🚀</span>
                            Expert Mode
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Programming Language</InputLabel>
                      <Select
                        value={language}
                        label="Programming Language"
                        onChange={(e) => setLocalLanguage(e.target.value)}
                        required
                        sx={{ 
                          borderRadius: 2,
                          backgroundColor: 'white'
                        }}
                      >
                        {Object.entries(languageInfo).map(([lang, info]) => (
                          <MenuItem key={lang} value={lang}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '8px', fontSize: '1.2rem' }}>{info.icon}</span>
                              {lang.charAt(0).toUpperCase() + lang.slice(1)}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{
                    py: 2,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                    background: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FF512F 20%, #DD2476 90%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
                    }
                  }}
                >
                  {familiarity === 'expert' ? 'Take Expert Quiz' : 'Start Learning Journey'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TaskSelection; 