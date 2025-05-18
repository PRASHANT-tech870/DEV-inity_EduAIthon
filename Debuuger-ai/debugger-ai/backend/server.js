import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the model
const genAI = new GoogleGenerativeAI('AIzaSyCMEPSK6GFQiZm48zO5dgE1QaoGYmcfQGw');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// GitHub search configuration
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_SEARCH_HEADERS = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeAware-App'
};

// Function to format search query based on language and error type
function formatGitHubSearchQuery(language, errorType) {
    // Remove generic words to focus on the specific error type
    const cleanedErrorType = errorType
        .replace(/(error|issue|problem)/gi, '')
        .trim();

    // Create language-specific labels and keywords
    const languageMap = {
        "Python": ["python", "django", "flask"],
        "JavaScript": ["javascript", "nodejs", "react", "vue", "angular"],
        "C++": ["cpp", "c++", "cmake"]
    };

    const languageTerms = languageMap[language] || [language.toLowerCase()];
    
    // Construct the search query
    return `${cleanedErrorType} language:${language.toLowerCase()} label:good-first-issue,help-wanted state:open`;
}

// Function to generate a coding challenge
const generateChallenge = async (language, difficulty) => {
    const errorTypes = {
        beginner: [
            ...(language === "Python" ? [
                "syntax error (like missing parentheses, brackets, or semicolons)",
                "basic indentation errors",
                "simple variable naming issues",
                "missing quotes in strings"
            ] : []),
            ...(language === "JavaScript" ? [
                "syntax error (like missing brackets or semicolons)",
                "undefined variable usage",
                "missing quotes in strings",
                "incorrect function declarations"
            ] : []),
            ...(language === "C++" ? [
                "missing semicolons",
                "missing curly braces",
                "undeclared variables",
                "missing include statements",
                "incorrect variable declarations"
            ] : [])
        ],
        intermediate: [
            ...(language === "Python" ? [
                "logical errors in conditionals",
                "incorrect loop conditions",
                "scope-related issues",
                "type conversion problems"
            ] : []),
            ...(language === "JavaScript" ? [
                "scope issues with var/let/const",
                "async/await misuse",
                "incorrect array methods",
                "type coercion problems"
            ] : []),
            ...(language === "C++" ? [
                "pointer misuse",
                "memory allocation errors",
                "incorrect array indexing",
                "reference vs value confusion",
                "type casting issues"
            ] : [])
        ],
        expert: [
            ...(language === "Python" ? [
                "complex algorithmic errors",
                "advanced data structure implementation issues",
                "optimization problems",
                "memory management issues",
                "concurrency problems"
            ] : []),
            ...(language === "JavaScript" ? [
                "closure-related bugs",
                "promise chain issues",
                "memory leaks",
                "event loop misconceptions",
                "prototype inheritance problems"
            ] : []),
            ...(language === "C++" ? [
                "memory leaks",
                "complex template errors",
                "multi-threading issues",
                "STL container misuse",
                "complex inheritance problems"
            ] : [])
        ]
    };

    const selectedError = errorTypes[difficulty][Math.floor(Math.random() * errorTypes[difficulty].length)];

    // Language-specific examples of how to introduce the error
    const errorExamples = {
        "Python": {
            "syntax error": "Example: print('Hello' -> Missing closing parenthesis",
            "basic indentation errors": "Example: if x > 0:\\nprint('Not indented')",
            "missing quotes": "Example: print(Hello) -> Missing quotes around string"
        },
        "JavaScript": {
            "syntax error": "Example: if (x > 0) { console.log('Hi') -> Missing closing brace",
            "undefined variable": "Example: console.log(undefinedVar)",
            "missing semicolon": "Example: let x = 5 let y = 10"
        },
        "C++": {
            "missing semicolons": "Example: int x = 5 int y = 10",
            "missing include": "Example: Using cout without #include <iostream>",
            "undeclared variables": "Example: sum = num1 + num2; // without declaring variables"
        }
    };

    const prompt = `
    Generate a coding challenge in ${language} that MUST contain an intentional ${selectedError}.

    CRITICAL REQUIREMENTS:
    1. The code MUST BE BROKEN and MUST NOT WORK when run
    2. You MUST introduce a clear ${selectedError}
    3. The error must be obvious and match the specified type
    4. DO NOT provide partially working or correct code
    5. The code should fail when attempted to run/compile

    ${language === "C++" ? `For C++:
    - Include necessary header files (iostream, etc.)
    - Use main() function
    - But INTENTIONALLY break the code with the specified error type` : ""}

    ${language === "Python" ? `For Python:
    - Use proper Python syntax
    - But INTENTIONALLY break it with the specified error type` : ""}

    ${language === "JavaScript" ? `For JavaScript:
    - Use proper JavaScript syntax
    - But INTENTIONALLY break it with the specified error type` : ""}

    Example of how to introduce the error:
    ${errorExamples[language][selectedError] || "Make sure the error is clear and obvious"}

    Respond in this exact format:
    TITLE: [A descriptive title for the challenge]
    DESCRIPTION: [Describe what the code is SUPPOSED to do when fixed]
    BUGGY_CODE: [Code with the INTENTIONAL ${selectedError} - THIS MUST BE BROKEN!]
    EXPECTED_OUTPUT: [What the code should output AFTER being fixed]
    HINT: [A hint pointing to the ${selectedError}]

    VERIFICATION:
    - Double-check that the code is actually broken
    - Ensure the error matches the specified type
    - Make sure the error is clear and obvious
    - The code must fail when run/compiled

    Remember: The goal is to create a LEARNING OPPORTUNITY by introducing a specific type of error!
    `;

    let attempts = 0;
    const maxAttempts = 3;
    let challenge;

    while (attempts < maxAttempts) {
        try {
            const result = await model.generateContent(prompt);
            if (!result?.response) {
                throw new Error("Failed to generate challenge");
            }

            const response = result.response.text();
            
            // Parse the response
            const titleMatch = response.match(/TITLE:\s*(.+)/);
            const descriptionMatch = response.match(/DESCRIPTION:\s*(.+?)(?=BUGGY_CODE:|$)/s);
            const codeMatch = response.match(/BUGGY_CODE:\s*(.+?)(?=EXPECTED_OUTPUT:|$)/s);
            const outputMatch = response.match(/EXPECTED_OUTPUT:\s*(.+?)(?=HINT:|$)/s);
            const hintMatch = response.match(/HINT:\s*(.+)$/s);

            if (!titleMatch || !descriptionMatch || !codeMatch || !outputMatch || !hintMatch) {
                throw new Error("Generated challenge format is incorrect");
            }

            // Verify that the code actually contains errors
            const code = codeMatch[1].trim();
            if (code.length < 10) {
                throw new Error("Generated code is too short");
            }

            // Additional validation based on error type
            const validationError = validateError(code, selectedError, language);
            if (validationError) {
                throw new Error(validationError);
            }

            challenge = {
                id: Date.now(),
                title: titleMatch[1].trim(),
                description: descriptionMatch[1].trim(),
                code: code,
                expectedOutput: outputMatch[1].trim(),
                hint: hintMatch[1].trim(),
                language,
                difficulty,
                errorType: selectedError
            };

            break;
        } catch (error) {
            attempts++;
            console.log(`Attempt ${attempts} failed: ${error.message}`);
            if (attempts === maxAttempts) {
                throw new Error("Failed to generate a valid challenge after multiple attempts");
            }
        }
    }

    return challenge;
};

// Helper function to validate that the code contains the specified error
function validateError(code, errorType, language) {
    // Basic validation based on error type and language
    if (language === "Python") {
        if (errorType.includes("indentation") && !code.includes("    ")) {
            return "Code doesn't contain indentation-related content";
        }
        if (errorType.includes("syntax") && code.split('\n').every(line => !line.includes("("))) {
            return "Code doesn't contain potential syntax error elements";
        }
    }
    
    if (language === "JavaScript") {
        if (errorType.includes("semicolon") && !code.includes(";")) {
            return "Code doesn't contain semicolon-related content";
        }
        if (errorType.includes("undefined") && !code.includes("var") && !code.includes("let") && !code.includes("const")) {
            return "Code doesn't contain variable declarations";
        }
    }
    
    if (language === "C++") {
        if (errorType.includes("semicolon") && !code.includes(";")) {
            return "Code doesn't contain semicolon-related content";
        }
        if (errorType.includes("include") && !code.toLowerCase().includes("include")) {
            return "Code doesn't contain include statements";
        }
        if (errorType.includes("pointer") && !code.includes("*")) {
            return "Code doesn't contain pointer-related content";
        }
    }
    
    return null;
}

// Endpoint to get a random challenge
app.get("/challenge", async (req, res) => {
    try {
        const { language = "Python", difficulty = "beginner" } = req.query;
        const decodedLanguage = decodeURIComponent(language);
        
        if (!["Python", "JavaScript", "C++"].includes(decodedLanguage)) {
            return res.status(400).json({
                error: "Invalid language. Supported languages: Python, JavaScript, C++"
            });
        }

        if (!["beginner", "intermediate", "expert"].includes(difficulty)) {
            return res.status(400).json({
                error: "Invalid difficulty. Supported levels: beginner, intermediate, expert"
            });
        }

        console.log(`Generating ${difficulty} ${decodedLanguage} challenge...`);
        const challenge = await generateChallenge(decodedLanguage, difficulty);
        res.json(challenge);

    } catch (err) {
        console.error("Challenge generation error:", err);
        res.status(500).json({
            error: "Failed to generate challenge",
            details: err.message
        });
    }
});

const evaluateCode = async (code, expected, language) => {
    const prompt = `
    You are a strict code evaluator. Your task is to determine if the code produces the expected output.
    
    CODE TO EVALUATE:
    \`\`\`${language}
    ${code}
    \`\`\`

    EXPECTED OUTPUT:
    \`\`\`
    ${expected}
    \`\`\`

    Evaluate if this code would EXACTLY produce the expected output.
    
    Respond in this EXACT format (replace [...] with your content):
    STATUS: [MUST be either PASS or FAIL - nothing else]
    REASON: [Your detailed explanation]

    Rules:
    1. Status must be PASS only if the code produces EXACTLY the expected output
    2. Status must be FAIL if:
       - There are syntax errors
       - The output would be different
       - There would be runtime errors
       - The code is incomplete
    3. Be very strict about matching the expected output
    `;

    const result = await model.generateContent(prompt);
    if (!result?.response) {
        throw new Error("No response from Gemini API");
    }

    const response = result.response.text();
    console.log("Raw Gemini Response:", response);

    // Extract status and reason using regex
    const statusMatch = response.match(/STATUS:\s*(PASS|FAIL)/i);
    const reasonMatch = response.match(/REASON:\s*(.+)/s);

    if (!statusMatch) {
        console.warn("Could not find STATUS in response:", response);
        return {
            pass: false,
            reasoning: "Could not determine code correctness. Please try again."
        };
    }

    const status = statusMatch[1].toUpperCase();
    const reason = reasonMatch ? reasonMatch[1].trim() : "No explanation provided";

    return {
        pass: status === "PASS",
        reasoning: reason
    };
};

app.post("/evaluate", async (req, res) => {
    try {
        const { code, expected, language } = req.body;
        
        if (!code || !expected || !language) {
            return res.status(400).json({
                error: "Missing required fields",
                details: "code, expected, and language are required"
            });
        }

        console.log("Evaluating:", { code, expected, language });
        const result = await evaluateCode(code, expected, language);
        console.log("Evaluation result:", result);
        
        res.json(result);

    } catch (err) {
        console.error("Evaluation error:", err);
        res.status(500).json({
            error: "Evaluation failed",
            details: err.message,
            stack: err.stack
        });
    }
});

// New endpoint to search GitHub issues
app.get("/github-issues", async (req, res) => {
    try {
        const { language, errorType } = req.query;
        
        if (!language || !errorType) {
            return res.status(400).json({
                error: "Missing required parameters: language and errorType"
            });
        }

        const searchQuery = formatGitHubSearchQuery(language, errorType);
        const searchUrl = `${GITHUB_API_URL}/search/issues?q=${encodeURIComponent(searchQuery)}&sort=created&order=desc&per_page=5`;

        const response = await fetch(searchUrl, {
            headers: GITHUB_SEARCH_HEADERS
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Format the response to include relevant information
        const formattedIssues = data.items.map(issue => ({
            title: issue.title,
            url: issue.html_url,
            repository: issue.repository_url.split('/').slice(-2).join('/'),
            created_at: issue.created_at,
            labels: issue.labels.map(label => ({
                name: label.name,
                color: label.color
            })),
            state: issue.state
        }));

        res.json({
            total_count: data.total_count,
            issues: formattedIssues
        });

    } catch (err) {
        console.error("GitHub search error:", err);
        res.status(500).json({
            error: "Failed to search GitHub issues",
            details: err.message
        });
    }
});

app.listen(8002, () => console.log("Server running on http://localhost:8002"));
