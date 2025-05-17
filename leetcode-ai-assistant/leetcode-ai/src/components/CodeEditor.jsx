import React from 'react';
import { Box, Paper } from '@mui/material';

// In a real application, you would likely use a component like Monaco Editor 
// or CodeMirror for syntax highlighting and code editing features

const CodeEditor = ({ language, value, onChange }) => {
  // Define default code templates based on language
  const getDefaultCode = () => {
    switch (language) {
      case 'Python':
        return '# Write your Python solution here\n\nclass Solution:\n    def solution_method(self, input_param):\n        # Your code here\n        pass';
      case 'Java':
        return '// Write your Java solution here\n\nclass Solution {\n    public int solutionMethod(int[] nums) {\n        // Your code here\n        return 0;\n    }\n}';
      case 'C++':
        return '// Write your C++ solution here\n\nclass Solution {\npublic:\n    int solutionMethod(vector<int>& nums) {\n        // Your code here\n        return 0;\n    }\n};';
      default:
        return '// Write your solution here';
    }
  };

  return (
    <Paper 
      elevation={2}
      sx={{
        mt: 2, 
        mb: 2, 
        bgcolor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '4px',
        '&:hover': {
          borderColor: '#555',
        },
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bgcolor: 'rgba(30, 30, 30, 0.8)',
          px: 1,
          py: 0.5,
          borderBottomLeftRadius: '4px',
          color: '#999',
          fontSize: '0.75rem',
        }}
      >
        {language}
      </Box>

      <textarea
        value={value || getDefaultCode()}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          minHeight: '300px',
          padding: '16px',
          fontFamily: '"Fira Code", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#eee',
          backgroundColor: 'transparent',
          border: 'none',
          resize: 'vertical',
          outline: 'none',
        }}
        spellCheck="false"
        placeholder={getDefaultCode()}
      />
    </Paper>
  );
};

export default CodeEditor; 