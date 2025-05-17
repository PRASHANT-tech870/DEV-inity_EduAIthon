import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import TaskSelection from './pages/TaskSelection';
import CodeEditor from './pages/CodeEditor';
import Quiz from './pages/Quiz';
import Learning from './pages/Learning';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<TaskSelection />} />
          <Route path="/editor" element={<CodeEditor />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/learning" element={<Learning />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 