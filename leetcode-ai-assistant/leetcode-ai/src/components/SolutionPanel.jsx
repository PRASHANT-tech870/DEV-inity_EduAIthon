import React from 'react';
import { Box, Button, Typography, Paper, Grid, Divider, Chip, CircularProgress } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CodeIcon from '@mui/icons-material/Code';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import BugReportIcon from '@mui/icons-material/BugReport';
import MarkdownRenderer from './MarkdownRenderer';

const SolutionPanel = ({
  reviewRequested, setReviewRequested,
  solutionRequested, setSolutionRequested,
  intuitionRequested, setIntuitionRequested,
  dryRunRequested, setDryRunRequested,
  mockReview, mockSolution, mockIntuition, mockDryRun,
  loadingReview, loadingSolution, loadingIntuition, loadingDryRun
}) => {

  // In a real app, these would make API calls to your backend
  const handleRequestReview = () => setReviewRequested(true);
  const handleRequestSolution = () => setSolutionRequested(true);
  const handleRequestIntuition = () => setIntuitionRequested(true);
  const handleRequestDryRun = () => setDryRunRequested(true);

  const ContentSection = ({ title, content, icon, color, isLoading }) => (
    <Paper
      elevation={3}
      sx={{
        mt: 3,
        p: 3,
        borderLeft: `4px solid ${color}`,
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100px'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        mb: 2,
      }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: `${color}22`,
          mr: 2,
        }}>
          {icon}
        </Box>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <CircularProgress size={30} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Generating response...
          </Typography>
        </Box>
      ) : (
        <MarkdownRenderer content={content} />
      )}
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI Assistance
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant={reviewRequested ? "contained" : "outlined"}
            color="primary"
            startIcon={<SchoolIcon />}
            onClick={handleRequestReview}
            sx={{ py: 1.5 }}
            disabled={reviewRequested && loadingReview}
          >
            Code Review
          </Button>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant={solutionRequested ? "contained" : "outlined"}
            color="primary"
            startIcon={<CodeIcon />}
            onClick={handleRequestSolution}
            sx={{ py: 1.5 }}
            disabled={solutionRequested && loadingSolution}
          >
            Show Solution
          </Button>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant={intuitionRequested ? "contained" : "outlined"}
            color="primary"
            startIcon={<LightbulbIcon />}
            onClick={handleRequestIntuition}
            sx={{ py: 1.5 }}
            disabled={intuitionRequested && loadingIntuition}
          >
            Intuition
          </Button>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Button
            fullWidth
            variant={dryRunRequested ? "contained" : "outlined"}
            color="primary"
            startIcon={<BugReportIcon />}
            onClick={handleRequestDryRun}
            sx={{ py: 1.5 }}
            disabled={dryRunRequested && loadingDryRun}
          >
            Dry Run
          </Button>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 4 }}>
        <Chip label="RESULTS" />
      </Divider>
      
      {reviewRequested && (
        <ContentSection 
          title="Code Review" 
          content={mockReview}
          icon={<SchoolIcon sx={{ color: '#4fc3f7' }} />}
          color="#4fc3f7"
          isLoading={loadingReview}
        />
      )}
      
      {solutionRequested && (
        <ContentSection 
          title="Optimal Solution" 
          content={mockSolution}
          icon={<CodeIcon sx={{ color: '#ff6e40' }} />}
          color="#ff6e40"
          isLoading={loadingSolution}
        />
      )}
      
      {intuitionRequested && (
        <ContentSection 
          title="Problem Intuition" 
          content={mockIntuition}
          icon={<LightbulbIcon sx={{ color: '#ffeb3b' }} />}
          color="#ffeb3b"
          isLoading={loadingIntuition}
        />
      )}
      
      {dryRunRequested && (
        <ContentSection 
          title="Dry Run & Explanation" 
          content={mockDryRun}
          icon={<BugReportIcon sx={{ color: '#66bb6a' }} />}
          color="#66bb6a"
          isLoading={loadingDryRun}
        />
      )}
    </Box>
  );
};

export default SolutionPanel;