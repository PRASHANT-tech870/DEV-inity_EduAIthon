import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Paper, 
  TextField, Button, Select, MenuItem, 
  FormControl, InputLabel, Tabs, Tab, 
  AppBar, Toolbar, Avatar, Divider, 
  Stepper, Step, StepLabel, CircularProgress, Alert
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SendIcon from '@mui/icons-material/Send';
import BugReportIcon from '@mui/icons-material/BugReport';
import SchoolIcon from '@mui/icons-material/School';
import SolutionPanel from './components/SolutionPanel';
import HintPanel from './components/HintPanel';
import CodeEditor from './components/CodeEditor';
import aiApi from './services/api';

function App() {
  const [problem, setProblem] = useState('');
  const [language, setLanguage] = useState('Python');
  const [userCode, setUserCode] = useState('');
  const [userExplanation, setUserExplanation] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [currentHint, setCurrentHint] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [solutionRequested, setSolutionRequested] = useState(false);
  const [intuitionRequested, setIntuitionRequested] = useState(false);
  const [dryRunRequested, setDryRunRequested] = useState(false);
  
  // State for API responses
  const [hints, setHints] = useState([]);
  const [review, setReview] = useState('');
  const [solution, setSolution] = useState('');
  const [intuition, setIntuition] = useState('');
  const [dryRun, setDryRun] = useState('');
  
  // Loading states
  const [loadingHints, setLoadingHints] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [loadingIntuition, setLoadingIntuition] = useState(false);
  const [loadingDryRun, setLoadingDryRun] = useState(false);
  
  // Error states
  const [error, setError] = useState('');

  // Load hints when problem changes and hints tab is selected
  useEffect(() => {
    if (activeTab === 1 && problem && hints.length === 0) {
      loadHints();
    }
  }, [activeTab, problem]);

  // Load review when requested
  useEffect(() => {
    if (reviewRequested && !review && !loadingReview) {
      loadReview();
    }
  }, [reviewRequested]);

  // Load solution when requested
  useEffect(() => {
    if (solutionRequested && !solution && !loadingSolution) {
      loadSolution();
    }
  }, [solutionRequested]);

  // Load intuition when requested
  useEffect(() => {
    if (intuitionRequested && !intuition && !loadingIntuition) {
      loadIntuition();
    }
  }, [intuitionRequested]);

  // Load dry run when requested
  useEffect(() => {
    if (dryRunRequested && !dryRun && !loadingDryRun) {
      loadDryRun();
    }
  }, [dryRunRequested]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSubmit = () => {
    setSubmitted(true);
    setActiveTab(2); // Switch to analysis tab
  };

  const loadHints = async () => {
    if (!problem) return;
    
    setLoadingHints(true);
    setError('');
    
    try {
      const response = await aiApi.getHints(problem);
      setHints(response.data.hints);
    } catch (err) {
      console.error("Error fetching hints:", err);
      setError("Failed to get hints. Please try again.");
    } finally {
      setLoadingHints(false);
    }
  };

  const loadReview = async () => {
    if (!problem || !userCode) return;
    
    setLoadingReview(true);
    setError('');
    
    try {
      const response = await aiApi.getReview(problem, userCode, userExplanation, language);
      setReview(response.data.review);
    } catch (err) {
      console.error("Error fetching review:", err);
      setError("Failed to get review. Please try again.");
    } finally {
      setLoadingReview(false);
    }
  };

  const loadSolution = async () => {
    if (!problem) return;
    
    setLoadingSolution(true);
    setError('');
    
    try {
      const response = await aiApi.getSolution(problem, language);
      setSolution(response.data.solution);
    } catch (err) {
      console.error("Error fetching solution:", err);
      setError("Failed to get solution. Please try again.");
    } finally {
      setLoadingSolution(false);
    }
  };

  const loadIntuition = async () => {
    if (!problem) return;
    
    setLoadingIntuition(true);
    setError('');
    
    try {
      const response = await aiApi.getIntuition(problem);
      setIntuition(response.data.intuition);
    } catch (err) {
      console.error("Error fetching intuition:", err);
      setError("Failed to get intuition. Please try again.");
    } finally {
      setLoadingIntuition(false);
    }
  };

  const loadDryRun = async () => {
    if (!problem || !userCode) return;
    
    setLoadingDryRun(true);
    setError('');
    
    try {
      const response = await aiApi.getDryRun(problem, userCode, language);
      setDryRun(response.data.dryRun);
    } catch (err) {
      console.error("Error fetching dry run:", err);
      setError("Failed to get dry run analysis. Please try again.");
    } finally {
      setLoadingDryRun(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar>
          <CodeIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            LeetCode AI Assistant
          </Typography>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>AI</Avatar>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 8, flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Problem input area */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                LeetCode Problem
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="Paste your LeetCode problem here..."
                variant="outlined"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  label="Language"
                >
                  <MenuItem value="Python">Python</MenuItem>
                  <MenuItem value="C++">C++</MenuItem>
                  <MenuItem value="Java">Java</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Tabs for workflow */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 0 }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                <Tab label="Solve Problem" />
                <Tab label="Get Hints" />
                {submitted && <Tab label="Analysis & Feedback" />}
              </Tabs>
              
              {/* Solve Problem Tab */}
              {activeTab === 0 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Write Your Solution
                  </Typography>
                  <CodeEditor 
                    language={language} 
                    value={userCode} 
                    onChange={setUserCode} 
                  />
                  <TextField
                    fullWidth
                    placeholder="Explain your approach (optional)"
                    variant="outlined"
                    value={userExplanation}
                    onChange={(e) => setUserExplanation(e.target.value)}
                    sx={{ mt: 2, mb: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    endIcon={<SendIcon />}
                    onClick={handleSubmit}
                    disabled={!userCode || !problem}
                    sx={{ mt: 2 }}
                  >
                    Submit Solution
                  </Button>
                </Box>
              )}
              
              {/* Hints Tab */}
              {activeTab === 1 && (
                <Box sx={{ p: 3 }}>
                  {loadingHints ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Generating hints...
                      </Typography>
                    </Box>
                  ) : (
                    <HintPanel 
                      problem={problem} 
                      hints={hints} 
                      currentHint={currentHint}
                      setCurrentHint={setCurrentHint}
                    />
                  )}
                </Box>
              )}
              
              {/* Analysis Tab (only shown after submission) */}
              {activeTab === 2 && submitted && (
                <SolutionPanel
                  reviewRequested={reviewRequested}
                  setReviewRequested={setReviewRequested}
                  solutionRequested={solutionRequested}
                  setSolutionRequested={setSolutionRequested}
                  intuitionRequested={intuitionRequested} 
                  setIntuitionRequested={setIntuitionRequested}
                  dryRunRequested={dryRunRequested}
                  setDryRunRequested={setDryRunRequested}
                  mockReview={review}
                  mockSolution={solution}
                  mockIntuition={intuition}
                  mockDryRun={dryRun}
                  loadingReview={loadingReview}
                  loadingSolution={loadingSolution}
                  loadingIntuition={loadingIntuition}
                  loadingDryRun={loadingDryRun}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            LeetCode AI Assistant - Your coding interview companion
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default App; 