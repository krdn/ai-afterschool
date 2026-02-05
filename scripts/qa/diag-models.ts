import { Anthropic } from '@anthropic-ai/sdk';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

async function main() {
    console.log('🔍 Listing available models...');
    try {
        const page = await anthropic.models.list();
        for (const model of page.data) {
            console.log(`- ${model.id} (${model.display_name})`);
        }
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

main();
