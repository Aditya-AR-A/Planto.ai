import * as Google from '@google/generative-ai';

import * as fs from 'fs';
import * as path from 'path';

function getConfig() {
    const configPath = path.join(__dirname, '..', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    return config;
}

const config = getConfig();

const googleAI = new Google.GoogleGenerativeAI(config.api.gemini.key);


/**
 * Get a completion from Google AI.
 * 
 * @param {string} prompt The prompt to generate a completion for.
 * @param {string} sysRole The system role to use.
 * @returns {Promise<string>} The generated completion.
 */
export const getCompletionFromGoogle = async (prompt: string, sysRole: string): Promise<string> => {
    console.log('Response from gemini');
    const modelName = config.api.gemini.model;

    // Incorporate the system role into the prompt
    const fullPrompt = `System Role ${sysRole}\n\nUser: ${prompt}\n`;

    try {
        const model = googleAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        let responseContent = result.response.text();
        try {
            responseContent = responseContent.replace("```json\n", "").replace("\n```", "");
        } catch (error) {
            console.error('Error replacing response content:', error);
        }
        return responseContent;

    } catch (error: any) {
        return JSON.stringify({
            response_type: 3,
            message: `Error fetching completion from Google AI: ${error.message}`
        });
    }
};