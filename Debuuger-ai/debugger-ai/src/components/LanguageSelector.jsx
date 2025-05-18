import React, { useState } from 'react';

const LanguageSelector = ({ onselectstart }) => {
    const [language, setLanguage] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleStart = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(
                `http://localhost:8002/challenge?language=${encodeURIComponent(language)}&difficulty=${difficulty.toLowerCase()}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch challenge');
            }

            const challenge = await response.json();
            onselectstart(challenge, language);

        } catch (error) {
            console.error("Error fetching challenge:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="selector-model">
            <h1>Welcome to CodeAware</h1>
            <p className="text-gray-600 mb-6 text-center">
                Practice debugging with challenges
            </p>

            <label>
                Select Language:
                <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="select-input"
                >
                    <option value="">Choose</option>
                    <option value="Python">Python</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="C++">C++</option>
                </select>
            </label>

            <label>
                Select Level:
                <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="select-input"
                >
                    <option value="">Choose</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                </select>
            </label>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <button 
                onClick={handleStart} 
                disabled={!language || !difficulty || loading}
                className={loading ? 'loading' : ''}
            >
                {loading ? 'Generating Challenge...' : 'Start'}
            </button>
        </div>
    );
};

export default LanguageSelector;