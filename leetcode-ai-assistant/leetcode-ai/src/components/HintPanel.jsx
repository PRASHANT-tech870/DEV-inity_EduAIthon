import React, { useEffect } from 'react';
import { Box, Paper, Typography, Button, Alert, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import MarkdownRenderer from './MarkdownRenderer';

const HintPanel = ({ problem, hints, currentHint, setCurrentHint }) => {
  useEffect(() => {
    // Reset hints when problem changes
    setCurrentHint(0);
  }, [problem, setCurrentHint]);

  const handleNextHint = () => {
    if (currentHint < hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
  };

  if (!problem) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Please paste a LeetCode problem first to get hints.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <LightbulbIcon sx={{ mr: 1, color: 'warning.main' }} />
        Step-by-Step Hints
      </Typography>

      <Paper 
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: 'rgba(255, 235, 59, 0.05)',
          border: '1px solid rgba(255, 235, 59, 0.2)',
          borderRadius: '4px',
        }}
      >
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Hints are designed to guide you gradually without revealing the full solution.
        </Typography>
      </Paper>

      <Stepper activeStep={currentHint} orientation="vertical">
        {hints.map((hint, index) => (
          <Step key={index}>
            <StepLabel>
              <Typography sx={{ fontWeight: 'bold' }}>
                Hint {index + 1}
              </Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ py: 2 }}>
                <MarkdownRenderer content={hint} />
              </Box>
              {index < hints.length - 1 && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={handleNextHint}
                    endIcon={<NavigateNextIcon />}
                  >
                    Next Hint
                  </Button>
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {currentHint === hints.length && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography>
            You've seen all available hints. Try solving the problem now!
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default HintPanel; 