import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Box, Typography, Paper } from '@mui/material';
import '../assets/atom-one-dark.css';

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;
  
  return (
    <Box sx={{ 
      fontFamily: 'Roboto, "Fira Code", sans-serif',
      '& pre': {
        backgroundColor: '#282c34',
        padding: '16px',
        borderRadius: '4px',
        overflowX: 'auto',
        marginBottom: '16px',
      },
      '& code': {
        fontFamily: '"Fira Code", monospace',
        fontSize: '0.875rem',
      },
      '& p': {
        marginBottom: '16px',
      },
      '& h1, & h2, & h3, & h4, & h5, & h6': {
        marginTop: '24px',
        marginBottom: '16px',
      },
      '& ul, & ol': {
        paddingLeft: '24px',
        marginBottom: '16px',
      },
      '& table': {
        borderCollapse: 'collapse',
        width: '100%',
        marginBottom: '16px',
      },
      '& th, & td': {
        border: '1px solid #444',
        padding: '8px',
        textAlign: 'left',
      },
      '& blockquote': {
        borderLeft: '4px solid #666',
        paddingLeft: '16px',
        marginLeft: 0,
        marginRight: 0,
        fontStyle: 'italic',
      }
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({node, ...props}) => <Typography variant="h4" gutterBottom {...props} />,
          h2: ({node, ...props}) => <Typography variant="h5" gutterBottom {...props} />,
          h3: ({node, ...props}) => <Typography variant="h6" gutterBottom {...props} />,
          h4: ({node, ...props}) => <Typography variant="subtitle1" gutterBottom fontWeight="bold" {...props} />,
          h5: ({node, ...props}) => <Typography variant="subtitle2" gutterBottom fontWeight="bold" {...props} />,
          h6: ({node, ...props}) => <Typography variant="body1" gutterBottom fontWeight="bold" {...props} />,
          p: ({node, ...props}) => <Typography variant="body1" paragraph {...props} />,
          a: ({node, ...props}) => <a style={{ color: '#4fc3f7' }} {...props} />,
          code: ({node, inline, className, children, ...props}) => {
            return inline ? (
              <code 
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  padding: '0.2em 0.4em',
                  borderRadius: '3px',
                  fontSize: '85%',
                }} 
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre className={className} {...props}>
                <code>{children}</code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer; 