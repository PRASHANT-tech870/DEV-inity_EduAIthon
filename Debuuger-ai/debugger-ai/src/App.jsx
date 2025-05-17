import React, { useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import QuestionDisplay from './components/QuestionDisplay';

function App() {
  const [question,setQuestion] = useState(null);
  const [language,setLanguage] = useState(null);

  const handleBack = () =>{
    setLanguage(null);
    setQuestion(null);
  };

  return (
    <div className='h-screen'>
      {!question ? (
        <LanguageSelector 
        onselectstart = {(q,lang) =>{
            setQuestion(q);
            setLanguage(lang);
          }
        }
        />

      ) : (
        <QuestionDisplay question ={question} language = {language} onBack = {handleBack}/>
      )
        
      }


    </div>
  );
}








export default App;
