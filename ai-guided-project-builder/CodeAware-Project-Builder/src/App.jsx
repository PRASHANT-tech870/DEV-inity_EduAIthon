import { useState } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import ProjectBuilder from './components/ProjectBuilder'
import './App.css'

function App() {
  const [projectSession, setProjectSession] = useState(null)

  const handleProjectStart = (sessionData) => {
    setProjectSession(sessionData)
  }
  
  const handleReset = () => {
    setProjectSession(null)
  }

  return (
    <div className="app">
      {!projectSession ? (
        <WelcomeScreen onProjectStart={handleProjectStart} />
      ) : (
        <ProjectBuilder 
          sessionData={projectSession} 
          onReset={handleReset} 
        />
      )}
    </div>
  )
}

export default App
