import fs from 'fs';
import path from 'path';
import { Anthropic } from '@anthropic-ai/sdk';
import 'dotenv/config';
import dotenv from 'dotenv';

// Load .env.local if it exists
dotenv.config({ path: '.env.local' });

// Configuration
const SCENARIOS_PATH = path.join(process.cwd(), 'docs/qa/SCENARIOS.md');
const TESTS_DIR = path.join(process.cwd(), 'tests/e2e');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set in environment variables.');
    process.exit(1);
}

const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
});

async function main() {
    console.log('🚀 Starting Test Generation from SCENARIOS.md...');

    if (!fs.existsSync(SCENARIOS_PATH)) {
        console.error(`Error: Scenario file not found at ${SCENARIOS_PATH}`);
        process.exit(1);
    }
    const scenariosContent = fs.readFileSync(SCENARIOS_PATH, 'utf-8');

    if (!fs.existsSync(TESTS_DIR)) {
        fs.mkdirSync(TESTS_DIR, { recursive: true });
    }

    try {
        // Phase 1: Planning (Get list of files to create)
        console.log('📋 Phase 1: Planning test structure...');
        const planResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1024,
            system: `You are a Lead QA Engineer. Analyze the provided validation scenarios and determine the necessary Playwright test files (.spec.ts) to cover them.
      Return ONLY a JSON array of filenames. Example: ["auth.spec.ts", "student.spec.ts"]`,
            messages: [{ role: 'user', content: `Scenarios:\n${scenariosContent}\n\nList the test files to be created:` }],
        });

        const planTextBlock = planResponse.content.find(block => block.type === 'text');
        if (!planTextBlock || planTextBlock.type !== 'text') throw new Error('Invalid plan response');

        // Extract JSON array from potentially messy response
        const planJsonMatch = planTextBlock.text.match(/\[.*\]/s);
        if (!planJsonMatch) throw new Error('Could not parse file list JSON');

        const filesToGenerate = JSON.parse(planJsonMatch[0]) as string[];
        console.log(`Target files: ${filesToGenerate.join(', ')}`);

        // Phase 2: Generation (Generate each file)
        console.log('✍️  Phase 2: Generating test files...');

        for (const filename of filesToGenerate) {
            console.log(`   > Generating ${filename}...`);

            const fileResponse = await anthropic.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 8192,
                system: `You are a Playwright Expert. Generate the Code for the file '${filename}' based on the scenarios.
        - Use standard Playwright/TypeScript patterns.
        - Include comments referencing Scenario IDs (e.g. AUTH-01).
        - Return ONLY the code. No explanation, no backticks.`,
                messages: [{ role: 'user', content: `Base Scenarios:\n${scenariosContent}\n\nGenerate content for: ${filename}` }],
            });

            const fileTextBlock = fileResponse.content.find(block => block.type === 'text');
            if (!fileTextBlock || fileTextBlock.type !== 'text') continue;

            const code = fileTextBlock.text.replace(/```typescript|```ts|```/g, ''); // Simple cleanup
            const filePath = path.join(TESTS_DIR, filename);
            fs.writeFileSync(filePath, code);
        }

        console.log(`✨ Successfully generated ${filesToGenerate.length} test files.`);

    } catch (error) {
        console.error('Error during test generation:', error);
        process.exit(1);
    }
}

main();
