import React, {useEffect, useState} from "react";
import { Editor } from '@monaco-editor/react';
import GitHubIssues from './GitHubIssues';

const QuestionDisplay = ({question, language, onBack}) => {
    // Set timer based on difficulty
    const getInitialTime = (difficulty) => {
        switch(difficulty.toLowerCase()) {
            case 'beginner': return 5 * 60; // 5 minutes
            case 'intermediate': return 10 * 60; // 10 minutes
            case 'expert': return 15 * 60; // 15 minutes
            default: return 5 * 60; // default to 5 minutes
        }
    };

    const [timeLeft, setTimeLeft] = useState(getInitialTime(question.difficulty));
    const [code, setCode] = useState(question.code);
    const [result, setResult] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const [loading, setLoading] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [showSolution, setShowSolution] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if(prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");
        const sec = (seconds % 60).toString().padStart(2, "0");
        return `${min}:${sec}`;
    };

    const handleSubmit = async() => {
        try {
            setLoading(true);
            setAttempts(prev => prev + 1);
            
            console.log("Submitting code for evaluation:", {
                code,
                expected: question.expectedOutput,
                language
            });

            const res = await fetch("http://localhost:8001/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code,
                    expected: question.expectedOutput,
                    language,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Server error:", errorText);
                setResult({
                    pass: false,
                    reasoning: `Server error: ${res.status} - ${errorText}`
                });
                return;
            }

            const data = await res.json();
            console.log("Received evaluation result:", data);
            
            // Check if we should show solution after 5 failed attempts
            if (!data.pass && attempts + 1 >= 5) {
                setShowSolution(true);
            }
            
            // Auto-show hint after 3 failed attempts
            if (!data.pass && attempts + 1 >= 3) {
                setShowHint(true);
            }
            
            setResult(data);
        } catch (error) {
            console.error("Error during evaluation:", error);
            setResult({
                pass: false,
                reasoning: `Error during evaluation: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-container">
            {/* Left Panel - Problem Description and Results */}
            <div className="w-1/2 p-4 border-r overflow-y-auto">
                <button onClick={onBack} className="back-button mb-4">
                    ← Back to Selection
                </button>
                
                <h2 className="text-xl font-bold mb-2">{question.title}</h2>
                <p className="mb-4">{question.description}</p>
                
                <div className="mb-4">
                    <strong>Difficulty:</strong> {question.difficulty}
                </div>

                <div className="space-y-2 mb-4">
                    <p>
                        <span className="font-semibold">Expected Output: </span>
                        <span className="text-gray-700">{question.expectedOutput}</span>
                    </p>
                    <p>
                        <span className="font-semibold">Language: </span>
                        <span className="text-gray-700">{language}</span>
                    </p>
                    <p>
                        <span className="font-semibold">Timer: </span>
                        <span className="timer">{formatTime(timeLeft)}</span>
                    </p>
                    <p>
                        <span className="font-semibold">Attempts: </span>
                        <span className="text-gray-700">{attempts}</span>
                    </p>
                </div>

                {/* Result Display */}
                {result && (
                    <div className="result-container">
                        <div className={`result-status ${result.pass ? 'pass' : 'fail'}`}>
                            {result.pass ? 'Success!' : 'Not quite right...'}
                        </div>
                        <div className="result-explanation">
                            {result.reasoning}
                        </div>
                    </div>
                )}

                {/* Hint Section - Only show after 3 attempts or if manually shown */}
                {(attempts >= 3 || showHint) && (
                    <div className="mt-4">
                        <div className="hint-container p-4 bg-yellow-50 rounded-md border border-yellow-200">
                            <h3 className="text-lg font-semibold mb-2">Hint:</h3>
                            <p>{question.hint}</p>
                        </div>
                    </div>
                )}

                {/* Solution Section - Show after 5 failed attempts */}
                {showSolution && (
                    <div className="mt-4">
                        <div className="solution-container p-4 bg-green-50 rounded-md border border-green-200">
                            <h3 className="text-lg font-semibold mb-2">Solution:</h3>
                            <pre className="bg-white p-4 rounded-md overflow-x-auto">
                                <code>{question.expectedOutput}</code>
                            </pre>
                        </div>
                    </div>
                )}

                {/* GitHub Issues Section - Only show after successful completion */}
                {result && result.pass && (
                    <GitHubIssues 
                        language={language}
                        errorType={question.errorType}
                    />
                )}
            </div>

            {/* Right Panel - Code Editor */}
            <div className="w-1/2 p-4 flex flex-col">
                <div className="flex-grow">
                    <Editor
                        height="70vh"
                        language={language.toLowerCase()}
                        value={code}
                        onChange={(value) => setCode(value)}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            padding: { top: 10 }
                        }}
                        className="monaco-editor rounded-lg overflow-hidden"
                    />
                </div>
                <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="evaluate-button mt-4"
                >
                    {loading ? 'Evaluating...' : `Evaluate Code (Attempt ${attempts + 1})`}
                </button>
            </div>
        </div>
    );
};

export default QuestionDisplay;