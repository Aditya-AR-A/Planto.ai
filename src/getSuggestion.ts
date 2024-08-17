import * as fs from 'fs';
import * as path from 'path';
import * as response from "./responses";

import { getCompletionFromGroq } from "./models/groq";
import { getCompletionFromOpenAI } from "./models/openai";
import { getCompletionFromGoogle } from "./models/google";

import { AIContext } from "./getPrompt";


import { getConfig } from "./misscellaneous";


function defaultApi() {
    const api = getConfig().defaultApi;

    switch(api) {
        case(0): // groq
            console.log(">>> Response from Groq");
            return getCompletionFromGroq;
        case(1): // openai
            console.log(">>> Response from OpenAI");
            return getCompletionFromOpenAI;
        case(2): // google
            console.log(">>> Response from Google");
            return getCompletionFromGoogle;
        
        default:
            console.log(">>> Missing Api");
            return getCompletionFromGroq;
    }
}


function loadRole(fileName: string) {
    const filePath = path.join(__dirname, fileName);
    const role = fs.readFileSync(filePath, 'utf-8');

    return role;
}


function getRole(roleType: number) {
    switch(roleType) {
        case 0: // Copilot Role for prompt containg the Context and the Message
            return loadRole("./sysRoles/copilotMain.txt");

        case 1: // Copilot Role for prompt containg only the Message
            return loadRole("./sysRoles/copilotMessage.txt");
        
        case 2: // Inline Suggestion Role for prompt containg only the Context
            return loadRole("./sysRoles/inlineRole.txt");
        
        case 3: // Inline Tooltip Role for prompt containg only the Context
            return loadRole("./sysRoles/inlineTooltip.txt");
        
        default:
            console.log(">>> Missing Role");
            return loadRole("./sysRoles/copilotMain.txt");
    } 

}
export async function getResponse(promptType: number, additionalPrompt = ``) {
    const api = defaultApi();

    // console.log(new AIContext().getPrompt());
    switch(promptType) {
        case 0: // Copilot With context
            const prompt = new AIContext().getPrompt() + additionalPrompt;
            const responseWithContext = await api(prompt, getRole(0));
            console.log(responseWithContext);
            return responseWithContext;
        case 1: // Copilot Without context
            const responseWithoutContext = await api(additionalPrompt, getRole(1));
            console.log(responseWithoutContext);
            return responseWithoutContext;
        case 2: // Inline suggestion
            const responseInline = await api(new AIContext().getPrompt(), getRole(2));
            console.log(responseInline);
            return responseInline;
        case 3: // Inline Tooltip 
            const responseTooltip = await api(additionalPrompt, getRole(3));
            console.log(responseTooltip);
            return responseTooltip;
        default:
            return Promise.reject("Invalid prompt type");
    }
}