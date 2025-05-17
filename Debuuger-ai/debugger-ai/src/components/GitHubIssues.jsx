import React, { useState, useEffect } from 'react';

const GitHubIssues = ({ language, errorType }) => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIssues = async () => {
            if (!language || !errorType) return;

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `http://localhost:8001/github-issues?language=${encodeURIComponent(language)}&errorType=${encodeURIComponent(errorType)}`
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch GitHub issues');
                }

                const data = await response.json();
                setIssues(data.issues);
            } catch (error) {
                console.error("Error fetching GitHub issues:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchIssues();
    }, [language, errorType]);

    if (loading) {
        return (
            <div className="github-issues-container">
                <h3>Loading similar issues on GitHub...</h3>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="github-issues-container error">
                <h3>Error loading GitHub issues</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (issues.length === 0) {
        return (
            <div className="github-issues-container">
                <h3>Open Source Opportunities</h3>
                <p>No similar issues found on GitHub at the moment.</p>
            </div>
        );
    }

    return (
        <div className="github-issues-container">
            <h3>Similar Issues on GitHub</h3>
            <p className="text-sm text-gray-600 mb-4">
                These are open issues you could contribute to:
            </p>
            <div className="issues-list">
                {issues.map((issue) => (
                    <div key={issue.url} className="issue-card">
                        <h4>
                            <a 
                                href={issue.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="issue-title"
                            >
                                {issue.title}
                            </a>
                        </h4>
                        <p className="repository">
                            Repository: {issue.repository}
                        </p>
                        <div className="labels">
                            {issue.labels.map((label) => (
                                <span
                                    key={label.name}
                                    className="label"
                                    style={{
                                        backgroundColor: `#${label.color}`,
                                        color: parseInt(label.color, 16) > 0x7FFFFF ? '#000' : '#fff'
                                    }}
                                >
                                    {label.name}
                                </span>
                            ))}
                        </div>
                        <p className="created-at">
                            Created: {new Date(issue.created_at).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GitHubIssues; 