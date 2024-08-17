import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

const configPath = path.join(__dirname, 'config.json');

export function getConfig(): any {
    try {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error reading config file:', error);
        return {};
    }
}

export function setConfig(key: string, value: any): void {
    try {
        // Load the current config
        const configPath = path.join(__dirname, 'config.json');
        let config;

        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (err) {
            console.log('>>> Error Opening Config File');
            return;
        }
        // Convert defaultApi to a number if it's a string
        if (key === 'defaultApi' && typeof value === 'string') {
            value = parseInt(value, 10);
        }
        
        _.set(config, key, value);
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error writing to config file:', error);
    }
}


export function setApiKeyModel(key: string, model: string) {
    try {
                
        // Load the current config
        const configPath = path.join(__dirname, 'config.json');
        let config;
        const apis = ['groq', 'openai', 'gemini'];
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (err) {
            console.log('>>> Error Opening Config File');
            return;
        }
        const apiName = apis[config.defaultApi];
        if (key) {
            config.api[apiName].key = key;
        }
        if (model) {
            config.api[apiName].model = model;
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error writing to config file:', error);
    }
}






export function getTheme() {
    const config = getConfig();
    const themeToggleState = config.themeToggleState;
    return themeToggleState;
}