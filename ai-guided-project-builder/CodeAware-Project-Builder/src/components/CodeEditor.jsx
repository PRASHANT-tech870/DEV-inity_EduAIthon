import { useState, useRef, useEffect } from 'react';
import Editor from "@monaco-editor/react";

const defaultCode = {
  python: `# Python Example
print("Hello, World!")

# Define a function
def greet(name):
    return f"Hello, {name}!"

# Call the function
result = greet("Programmer")
print(result)`,
  javascript: `// JavaScript Example
console.log("Hello, World!");

// Define a function
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Call the function
const result = greet("Programmer");
console.log(result);`,
  html: `<!-- HTML Example -->
<!DOCTYPE html>
<html>
<head>
  <title>My Web Page</title>
</head>
<body>
  <header>
    <h1>Welcome to My Website</h1>
  </header>
  
  <nav>
    <ul>
      <li><a href="#home">Home</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
  
  <main>
    <section id="home">
      <h2>Home</h2>
      <p>This is the homepage content.</p>
    </section>
    
    <section id="about">
      <h2>About</h2>
      <p>Learn more about us here.</p>
    </section>
    
    <section id="contact">
      <h2>Contact</h2>
      <p>Get in touch with us.</p>
      <form>
        <label for="name">Name:</label>
        <input type="text" id="name" name="name"><br>
        
        <label for="email">Email:</label>
        <input type="email" id="email" name="email"><br>
        
        <label for="message">Message:</label>
        <textarea id="message" name="message"></textarea><br>
        
        <button type="submit">Submit</button>
      </form>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2023 My Website. All rights reserved.</p>
  </footer>
</body>
</html>`,
  css: `/* CSS Example */
/* Reset some default styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  background-color: #f4f4f4;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #333;
}

nav {
  background-color: #333;
  color: white;
  padding: 10px 0;
}

nav ul {
  list-style: none;
  display: flex;
  justify-content: center;
}

nav li {
  margin: 0 15px;
}

nav a {
  color: white;
  text-decoration: none;
}

nav a:hover {
  text-decoration: underline;
}

section {
  margin: 20px 0;
  padding: 20px;
  background-color: #f9f9f9;
}

h2 {
  border-bottom: 2px solid #333;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

form {
  display: grid;
  grid-gap: 10px;
  margin-top: 10px;
}

label {
  font-weight: bold;
}

input, textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 10px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #555;
}

footer {
  text-align: center;
  padding: 20px;
  background-color: #f4f4f4;
  margin-top: 20px;
}`
};

const webLanguageOptions = [
  { value: "html", label: "HTML", extension: ".html" },
  { value: "css", label: "CSS", extension: ".css" },
  { value: "javascript", label: "JavaScript", extension: ".js" },
];

const pythonLanguageOptions = [
  { value: "python", label: "Python", extension: ".py" },
];

const CodeEditor = ({ onCodeSubmit, onCodeChange, isLoading, initialLanguage, projectType, currentCode = {} }) => {
  const [language, setLanguage] = useState(initialLanguage || "html");
  const [code, setCode] = useState("");
  const editorRef = useRef(null);
  const initializedRef = useRef(false);

  // Get the appropriate language options based on project type
  const languageOptions = projectType === "python+streamlit" 
    ? pythonLanguageOptions 
    : webLanguageOptions;

  // Initialize code based on selected language and currentCode
  useEffect(() => {
    if (initialLanguage && !initializedRef.current) {
      setLanguage(initialLanguage);
      
      // Use currentCode if available, otherwise use default
      const initialCode = currentCode[initialLanguage] || defaultCode[initialLanguage];
      setCode(initialCode);
      
      if (onCodeChange) {
        onCodeChange(initialCode, initialLanguage);
      }
      
      initializedRef.current = true;
    }
  }, [initialLanguage, onCodeChange, currentCode]);

  // Update code when language changes to use the saved code for that language
  useEffect(() => {
    // When language changes, load the saved code for that language if available
    if (currentCode && currentCode[language]) {
      setCode(currentCode[language]);
    } else if (!currentCode[language] && !code) {
      // If no saved code for this language, use default code
      setCode(defaultCode[language]);
      if (onCodeChange) {
        onCodeChange(defaultCode[language], language);
      }
    }
  }, [language, currentCode]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    
    // Load the saved code for the new language if available
    if (currentCode && currentCode[newLanguage]) {
      setCode(currentCode[newLanguage]);
      if (onCodeChange) {
        onCodeChange(currentCode[newLanguage], newLanguage);
      }
    } else {
      // If no saved code, use default
      setCode(defaultCode[newLanguage]);
      if (onCodeChange) {
        onCodeChange(defaultCode[newLanguage], newLanguage);
      }
    }
  };

  const handleCodeChange = (value) => {
    console.log("Code changed:", value ? value.substring(0, 20) + "..." : "empty");
    setCode(value);
    if (onCodeChange) {
      onCodeChange(value, language);
    }
  };

  const handleSubmit = async () => {
    if (onCodeSubmit) {
      await onCodeSubmit(code, language);
    }
  };

  const getLanguageExtension = () => {
    const langOption = languageOptions.find(option => option.value === language);
    return langOption ? langOption.extension : ".txt";
  };

  return (
    <div className="code-editor-container">
      <div className="language-selector">
        <label htmlFor="language-select">Language:</label>
        <select
          id="language-select"
          value={language}
          onChange={handleLanguageChange}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button 
          className="execute-button" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Running..." : language === "html" || language === "css" ? "Render" : "Run Code"}
        </button>
      </div>
      
      <div className="editor-wrapper">
        <Editor
          height="100%"
          width="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            readOnly: false,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor; 