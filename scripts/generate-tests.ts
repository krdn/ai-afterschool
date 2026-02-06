
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Types for Scenario
interface Scenario {
    id: string;
    module: string; // e.g., 'Auth', 'Student'
    section: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
}

const SCENARIOS_PATH = path.join(process.cwd(), 'docs/qa/SCENARIOS.md');
const TESTS_DIR = path.join(process.cwd(), 'tests/e2e');

/**
 * Parses SCENARIOS.md and returns a list of Scenario objects
 */
function parseScenarios(content: string): Scenario[] {
    const scenarios: Scenario[] = [];
    const lines = content.split('\n');

    let currentModule = 'General';

    // Regex for Headers: ## 1. 인증 및 사용자 관리 (Auth)
    const headerRegex = /^##\s*\d+\.\s*(.+?)\s*$/;

    // Regex for Table Rows: | **AUTH-01** | 선생님 회원가입 | High | ...
    // Columns: ID | Name | Priority | Prereq | Steps | Expectation
    // Notes:
    // - ID is **bold**
    // - There might be alignment colons like :---:
    const rowRegex = /^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/;
    const separatorRegex = /^\|\s*:?-+:?\s*\|/;

    for (const line of lines) {
        // Skip separator lines
        if (separatorRegex.test(line)) continue;

        // Check for Module Header
        const headerMatch = line.match(headerRegex);
        if (headerMatch) {
            currentModule = headerMatch[1].trim(); // e.g., "인증 및 사용자 관리 (Auth)"
            continue;
        }

        // Check for Table Row
        const match = line.match(rowRegex);
        if (match) {
            const id = match[1].trim();
            const description = match[2].trim();
            const priorityStr = match[3].trim();

            // Basic priority mapping
            let priority: 'High' | 'Medium' | 'Low' = 'Medium';
            if (/High/i.test(priorityStr)) priority = 'High';
            if (/Low/i.test(priorityStr)) priority = 'Low';

            scenarios.push({
                id,
                module: currentModule,
                section: '',
                description,
                priority
            });
        }
    }
    return scenarios;
}

// LLM Configuration - Kimi Code uses Anthropic-compatible API
const API_URL = 'https://api.kimi.com/coding/v1/messages';
const API_KEY = process.env.KIMI_API_KEY;
const MODEL_NAME = 'kimi-k2.5';

if (!API_KEY) {
    console.error('❌ Error: KIMI_API_KEY is missing in .env');
    process.exit(1);
}

async function generateTestCode(scenario: Scenario): Promise<string> {
    // Anthropic-compatible messages format
    const messages = [
        {
            role: "user",
            content: `You are an expert Playwright Automation Engineer. Write strictly valid TypeScript Playwright test code. Output ONLY the code block with no explanations.

Write a Playwright test script (TypeScript) for the following scenario:

**Scenario ID**: ${scenario.id}
**Description**: ${scenario.description}
**Module**: ${scenario.module}

**Requirements**:
1. Use 'test' and 'expect' from '@playwright/test'.
2. Target URL: Use relative paths (e.g., page.goto('/auth/login')).
3. Selectors: Use resistant selectors (e.g., getByRole, getByLabel) or 'data-testid' if likely available.
4. Language: Korean comments.
5. Do NOT import non-existent modules. Only use '@playwright/test'.
6. Output ONLY the code block. No explanations.

**Example**:
test('${scenario.id}: ${scenario.description}', async ({ page }) => {
  // Implementation
});`
        }
    ];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                max_tokens: 4096,
                messages: messages,
                temperature: 0.2
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const rawCode = data.content[0].text;

        // Extract code block
        const codeMatch = rawCode.match(/```typescript([\s\S]*?)```/) || rawCode.match(/```([\s\S]*?)```/);
        return codeMatch ? codeMatch[1].trim() : rawCode.trim();

    } catch (error) {
        console.error(`⚠️ Failed to generate test for ${scenario.id}:`, error);
        return `// Error generating test for ${scenario.id}\n// ${error}`;
    }
}

async function main() {
    console.log('🚀 AI QA Agent: Generating Tests...');

    if (!fs.existsSync(SCENARIOS_PATH)) {
        console.error(`❌ Error: SCENARIOS.md not found at ${SCENARIOS_PATH}`);
        process.exit(1);
    }

    const content = fs.readFileSync(SCENARIOS_PATH, 'utf-8');
    const scenarios = parseScenarios(content);

    console.log(`✅ Found ${scenarios.length} scenarios in SCENARIOS.md`);

    // Group by Module
    const scenariosByModule: Record<string, Scenario[]> = {};
    scenarios.forEach(s => {
        if (!scenariosByModule[s.module]) scenariosByModule[s.module] = [];
        scenariosByModule[s.module].push(s);
    });

    console.log('📋 Scenarios by Module:');
    Object.keys(scenariosByModule).forEach(module => {
        console.log(`  - ${module}: ${scenariosByModule[module].length} scenarios`);
    });

    // Generate for ALL modules (Scale Up)
    console.log(`\n🤖 Generating tests for ALL modules...`);

    const outputDir = path.join(TESTS_DIR, 'auto_generated');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Loop through all modules
    for (const [moduleName, moduleScenarios] of Object.entries(scenariosByModule)) {
        console.log(`\n📦 Processing Module: ${moduleName}`);

        for (const scenario of moduleScenarios) {
            const filePath = path.join(outputDir, `${scenario.id}.spec.ts`);

            // Skip if file already exists (preserve manual fixes)
            if (fs.existsSync(filePath)) {
                console.log(`  - Skipping ${scenario.id} (File exists)`);
                continue;
            }

            process.stdout.write(`  - Generating ${scenario.id} with ${MODEL_NAME}... `);
            const code = await generateTestCode(scenario);

            const fileContent = `import { test, expect } from '@playwright/test';\n\n${code}`;
            fs.writeFileSync(filePath, fileContent);
            console.log(`Done -> ${filePath}`);
        }
    }

}

main().catch(console.error);
