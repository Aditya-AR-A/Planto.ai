import * as OpenAI from 'openai';

import * as fs from 'fs';
import * as path from 'path';

function getConfig() {
    const configPath = path.join(__dirname, '..', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    return config;
}

const config = getConfig();

const openai = new OpenAI.OpenAI({ apiKey: config.api.openai.key });

/**
 * Get a completion from OpenAI.
 * 
 * @param {string} prompt The prompt to generate a completion for.
 * @param {string} sysRole The system role to use.
 * @returns {Promise<string>} The generated completion. */
export const getCompletionFromOpenAI = async (prompt: string, sysRole: string): Promise<string> => {
    console.log('Response from openai');
    const modelName = config.api.openai.model;
    try {
        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: sysRole }, 
                { role: 'user', content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 1024
        });

        const responseContent = response.choices?.[0]?.message?.content || '';
        return responseContent;
    } catch (error: any) {
        return `{ "response_type": 3, "message": " Error fetching completion from OpenAI: ${error.message} " }`;
    }
};

