import * as Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

function getConfig() {
    const configPath = path.join(__dirname, '..', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    return config;
}

const config = getConfig();

const groq = new Groq.Groq({ apiKey: config.api.groq.key });


export async function getCompletionFromGroq(prompt: string, systemRole: string) {
    console.log('Response from groq');
    const modelName = config.api.groq.model;
    try {
        const response = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemRole }, 
                { role: 'user', content: prompt }
            ],
            model: modelName,
            temperature: 0.5,
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        const responseContent = response.choices?.[0]?.message?.content || '';
        return responseContent;
    } catch (error: any) {
        return `{ "response_type": 3, "message": " Error fetching Response from Groq: ${error.message} " }`;
    }}