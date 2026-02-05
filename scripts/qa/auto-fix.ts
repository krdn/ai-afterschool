import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Anthropic } from '@anthropic-ai/sdk';
import 'dotenv/config';
import dotenv from 'dotenv';

// Load .env.local if it exists
dotenv.config({ path: '.env.local' });

// Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set.');
    process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

async function main() {
    console.log('🔧 Starting Auto-Fix Procedure...');

    try {
        // 1. Read Arguments
        const targetFile = process.argv[2]; // e.g., src/app/(auth)/login/page.tsx
        const errorDescription = process.argv[3]; // "Timeout waiting for selector input[name=email]"

        if (!targetFile || !errorDescription) {
            console.error('Usage: npx tsx scripts/qa/auto-fix.ts <file_path> <error_description>');
            // For demo/fallback: Use hardcoded values if arguments missing
            console.log('⚠️ No arguments provided. Using default values for demo...');
        }

        // Default to the file we know is failing for the demo
        const sourceFilePath = targetFile || 'src/components/auth/login-form.tsx';

        // Default error log matching the actual failure we observed
        const errorLog = errorDescription || `
    Error: page.fill: Test timeout of 30000ms exceeded.
    Call log: - waiting for locator('input[name="email"]')
    Context: The test attempts to login but fails to find the email input field on the login page.
    `;

        console.log('❌ Analyzing Failure for:', sourceFilePath);
        console.log('📋 Error:', errorLog);

        if (!fs.existsSync(sourceFilePath)) {
            console.log(`Source file ${sourceFilePath} not found. Skipping auto-fix.`);
            return;
        }

        const sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');

        // 3. Prompt AI for Fix
        const prompt = `
    You are an Expert Software Engineer. A Playwright test is failing for the file '${sourceFilePath}'.

    ERROR LOG:
    "${errorLog}"
    
    SOURCE CODE:
    \`\`\`tsx
    ${sourceCode}
    \`\`\`
    
    ANALYSIS:
    The test expects an input with name="email", but it seems missing or different in the component.
    
    TASK:
    Refactor the component code to fix this error. 
    1. Ensure input fields have correct 'name', 'id', and 'type' attributes that match standard accessibility patterns.
    2. Add 'data-testid' attributes to critical elements (like inputs and buttons) to make testing more robust.
    3. Ensure the form structure is correct.
    
    Return ONLY the raw code for the full file. No markdown backticks.
    `;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8192,
            messages: [{ role: 'user', content: prompt }],
        });

        const textBlock = response.content.find(block => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new Error('No text block found in response');
        }
        const fixedCode = textBlock.text;

        // 4. Create Branch and Apply Fix
        const branchName = `fix/qa-auto-${Date.now()}`;
        execSync(`git checkout -b ${branchName}`);
        fs.writeFileSync(sourceFilePath, fixedCode);

        execSync(`git add ${sourceFilePath}`);
        execSync(`git commit -m "fix(qa): auto-fix based on test failure"`);
        // execSync(`git push origin ${branchName}`); // Uncomment in real env

        console.log(`✅ Fix applied in branch ${branchName}.`);

    } catch (error) {
        console.error('Error in auto-fix:', error);
    }
}

main();
