
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Configuration for Zhipu AI GLM-4.7
const API_KEY = process.env.ZHIPU_API_KEY;
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const MODEL_NAME = 'glm-4.7';
const TEST_RESULTS_PATH = path.join(process.cwd(), 'test-results.json');

if (!API_KEY) {
    console.error('❌ Error: ZHIPU_API_KEY is missing in .env');
    process.exit(1);
}

// Generate JWT token for Zhipu AI
function generateToken(apiKey: string, expiresIn: number = 3600): string {
    const parts = apiKey.split('.');
    if (parts.length !== 2) {
        throw new Error('Invalid Zhipu API Key format');
    }
    const [id, secret] = parts;

    const payload = {
        api_key: id,
        exp: Math.floor(Date.now() / 1000) + expiresIn,
        timestamp: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, secret, {
        algorithm: 'HS256',
        header: { alg: 'HS256', sign_type: 'SIGN' }
    });
}

interface TestError {
    message: string;
    location?: {
        file: string;
        line: number;
        column: number;
    };
    snippet?: string;
}

interface TestFailure {
    file: string;
    errors: TestError[];
}

async function fixTestCode(filePath: string, errors: TestError[]): Promise<boolean> {
    console.log(`\n🔧 Fixing: ${path.basename(filePath)}`);

    try {
        const originalCode = fs.readFileSync(filePath, 'utf-8');
        const errorDescriptions = errors.map(e => `Line ${e.location?.line}: ${e.message}`).join('\n');

        const messages = [
            {
                role: "system",
                content: `You are an expert Playwright Automation Engineer. Fix the provided TypeScript code based on the error messages.

CRITICAL RULES:
1. ALWAYS use 'test.describe' instead of 'describe'
2. NEVER redeclare 'test' - it's already imported from '@playwright/test'
3. Use proper Playwright test structure: test.describe() wrapping test() calls
4. Return ONLY the complete, corrected TypeScript code
5. Do NOT include markdown code fences in your response
6. Ensure all imports are correct and not duplicated
7. Use async/await properly with page interactions`
            },
            {
                role: "user",
                content: `Fix this Playwright test file:

**File**: ${path.basename(filePath)}

**Errors**:
${errorDescriptions}

**Original Code**:
\`\`\`typescript
${originalCode}
\`\`\`

Return ONLY the corrected TypeScript code, no explanations, no markdown code fences.`
            }
        ];

        const token = generateToken(API_KEY);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                temperature: 0.1,
                stream: false
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const rawCode = data.choices[0].message.content;

        // Extract code block if wrapped in markdown
        let fixedCode = rawCode.trim();
        const codeMatch = rawCode.match(/```(?:typescript|ts)?\n?([\s\S]*?)```/);
        if (codeMatch) {
            fixedCode = codeMatch[1].trim();
        }

        // Safety check: Don't overwrite if empty
        if (!fixedCode || fixedCode.length < 50) {
            console.error(`⚠️  AI returned invalid code for ${path.basename(filePath)}`);
            return false;
        }

        fs.writeFileSync(filePath, fixedCode);
        console.log(`✅ Fixed -> ${filePath}`);
        return true;

    } catch (error) {
        console.error(`❌ Failed to fix ${path.basename(filePath)}:`, error);
        return false;
    }
}

async function main() {
    console.log(`🚀 AI Auto-Fix Agent: Starting repair job using ${MODEL_NAME}...`);

    if (!fs.existsSync(TEST_RESULTS_PATH)) {
        console.error('❌ test-results.json not found. Run tests with --reporter=json first.');
        process.exit(1);
    }

    const results = JSON.parse(fs.readFileSync(TEST_RESULTS_PATH, 'utf-8'));
    const failures: Record<string, TestFailure> = {};

    // 1. Analyze Global Errors (Syntax Errors)
    if (results.errors && results.errors.length > 0) {
        console.log(`Found ${results.errors.length} global syntax errors.`);
        for (const err of results.errors) {
            if (err.location && err.location.file) {
                const file = err.location.file;
                if (!failures[file]) failures[file] = { file, errors: [] };
                failures[file].errors.push({
                    message: err.message,
                    location: err.location,
                    snippet: err.snippet
                });
            }
        }
    }

    const filesToFix = Object.values(failures);
    console.log(`\n🎯 Identified ${filesToFix.length} broken files.`);

    if (filesToFix.length === 0) {
        console.log('✨ No obvious errors found in report.');
    }

    // Fix Loop
    for (const failure of filesToFix) {
        await fixTestCode(failure.file, failure.errors);
    }

    console.log('\n🏁 Auto-Fix Job Completed.');
}

main().catch(console.error);
