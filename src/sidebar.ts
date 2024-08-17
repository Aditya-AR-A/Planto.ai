import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getTheme, setConfig, getConfig, setApiKeyModel } from './misscellaneous';
import { getResponse } from './getSuggestion';
import { AIContext } from './getPrompt';


/**
 * Class representing the sidebar view provider.
 * This class implements vscode.WebviewViewProvider to manage the webview
 * content and handle messages between the extension and the webview.
 */
export class SidebarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'sidebarView'; // Identifier for the sidebar view

    private contextTrigger: 0 | 1 = 1;
    private response: any;
    private code = '';
    private message = '';
    private response_type: 0 | 1 | 2 | 3 = 0;
    private error_message = '';
    private additionalMessage: string = '';
    private range_line = {
        "start": { "line": 0, "position": 0 },
        "end": { "line": 0, "position": 0 }
    };
    private _view: vscode.WebviewView | undefined;

    constructor(private readonly extensionUri: vscode.Uri) {} // Store the extension's URI

    public async sendPromptToWebview(prompt: string) {
        if (this._view) {
            try {
                const result = await getResponse(3, prompt);
                const response = this.parseStandardResponse(result);

                this.code = response.code;
                this.message = response.message;
                this.range_line = response.lineRange;

                this._view.webview.postMessage({ 
                    command: 'updateDisplay', 
                    element: 'displayCode', 
                    content: this.code 
                });
                this._view.webview.postMessage({ 
                    command: 'updateDisplay', 
                    element: 'displayMessage', 
                    content: this.message 
                });
            } catch (error) {
                console.error('Error processing prompt:', error);
                vscode.window.showErrorMessage('An error occurred while processing the prompt.');
            }
        }
    }

    private parseStandardResponse(result: string): {
        code: string;
        message: string;
        lineRange: { 
            start: { line: number; position: number }; 
            end: { line: number; position: number } 
        };
    } {
        try {
            const parsed = JSON.parse(result);
            return {
                code: parsed.code || '',
                message: parsed.message || '',
                lineRange: parsed.lineRange || { 
                    start: { line: 0, position: 0 }, 
                    end: { line: 0, position: 0 } 
                }
            };
        } catch (error) {
            console.error('Error parsing response:', error);
            return {
                code: result,
                message: 'Error parsing response',
                lineRange: { 
                    start: { line: 0, position: 0 }, 
                    end: { line: 0, position: 0 } 
                }
            };
        }
    }
    
    /**
     * Resolves the webview view once it's been created.
     * This method sets the webview's options and HTML content,
     * and listens for messages sent from the webview.
     *
     * @param {vscode.WebviewView} webviewView - The webview view instance.
     * @param {vscode.WebviewViewResolveContext} context - Context for resolving the view.
     * @param {vscode.CancellationToken} _token - A cancellation token.
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;
        // Enable scripts and set local resource roots for the webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
        };

        // Set the HTML content of the webview
        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Check and open settings panel if needed
        this.checkAndOpenSettingsPanel();

        // Listen for messages sent from the webview
        webviewView.webview.onDidReceiveMessage(async data => {
            switch (data.command) {
                // Handle your commands here
                case 'toggleTheme':
                    console.log(`Theme toggled to: ${data.theme}`);
                    
                    // Handle theme change in VS Code, if necessary
                    break;
                    
                case 'inlineSuggestToggle':
                    vscode.commands.executeCommand('adcopilot.toggleInlineSuggestions', data.checked);
                    break;
                    
                case 'apiSelected':
                    console.log(`Model selected: ${data.model}`);
                    setConfig('defaultApi', data.model);
                    // Handle the model selection in VS Code, if necessary
                    break;

                case 'apiSetting':
                    console.log('ApiSettings Triggered');
                    break;

                case 'toggleContextCheck':
                    this.contextTrigger = data.checked ? 1 : 0;
                    console.log(`Context check is ${this.contextTrigger}`);
                    break;

                case 'updateAdditionalMessage':
                    this.additionalMessage = data.message;
                    console.log(`Additional message updated: ${this.additionalMessage}`);
                    break;

                case 'getData':
                    this.checkAndOpenSettingsPanel();
                    console.log('Get button clicked');
                    let result = '';
                    try {
                        if (this.contextTrigger === 0) {
                            let prompt = this.additionalMessage ? 
                                this.additionalMessage : vscode.window.activeTextEditor?.document.getText();

                            result = await getResponse(this.contextTrigger, prompt);
                        } else {
                            let prompt = this.additionalMessage + new AIContext().getPrompt();
                            result = await getResponse(this.contextTrigger, prompt);
                        }

                        // send the message to the webview to clean the additional message input field
                        webviewView.webview.postMessage({ 
                            command: 'updateDisplay', 
                            element: 'additionalMessageInput', 
                            content: '' 
                        });

                        const standardResponse = this.parseStandardResponse(result);
                        this.code = standardResponse.code;
                        this.message = standardResponse.message;
                        this.range_line = standardResponse.lineRange;

                        webviewView.webview.postMessage({ 
                            command: 'updateDisplay', 
                            element: 'displayCode', 
                            content: this.code
                        });

                        webviewView.webview.postMessage({ 
                            command: 'updateDisplay', 
                            element: 'displayMessage', 
                            content: this.message
                        });
                    } catch (error) {
                        console.error('Error fetching response:', error);
                        vscode.window.showErrorMessage('An error occurred while fetching the data.');
                    }
                    break;

                case 'setData':
                    // Handle the 'Set' action
                    console.log('Set button clicked');
                    this.handleSetData(webviewView);
                    break;

                case 'rejectData':
                    // Handle the 'Reject' action
                    console.log('Reject button clicked');
                    this.code = '';
                    this.message = '';
                    this.response_type = 0;
                    this.error_message = '';
                    this.range_line = {
                        "start": { "line": 0, "position": 0 },
                        "end": { "line": 0, "position": 0 }
                    };
                    webviewView.webview.postMessage({ 
                        command: 'updateDisplay', 
                        element: 'displayMessage', 
                        content: '' 
                    });
                    webviewView.webview.postMessage({ 
                        command: 'updateDisplay', 
                        element: 'displayCode', 
                        content: '' 
                    });
                    break;

                case 'submitSettings':

                    if (data.apiKey || data.modelName) {
                        setApiKeyModel(data.apiKey, data.modelName);
                    }
                    break;

                case 'showInfo':
                    vscode.window.showInformationMessage(data.text);
                    break;
                case 'showError':
                    vscode.window.showErrorMessage(data.text);
                    break;
            }
        });
    }

    private async handleSetData(webviewView: vscode.WebviewView) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        if (!this.code || !this.range_line) {
            vscode.window.showErrorMessage('No code suggestion available to set.');
            return;
        }

        try {
            const startPos = new vscode.Position(this.range_line.start.line, this.range_line.start.position);
            const endPos = new vscode.Position(this.range_line.end.line, this.range_line.end.position);
            const range = new vscode.Range(startPos, endPos);

            await editor.edit(editBuilder => {
                editBuilder.replace(range, this.code);
            });

            vscode.window.showInformationMessage('Code suggestion applied successfully.');

            // Clear the code and range after setting
            this.code = '';
            this.range_line = { 
                start: { line: 0, position: 0 }, 
                end: { line: 0, position: 0 } 
            };

            // Update the webview to reflect the changes
            webviewView.webview.postMessage({ 
                command: 'updateDisplay', 
                element: 'displayCode', 
                content: '' 
            });
            webviewView.webview.postMessage({ 
                command: 'updateDisplay', 
                element: 'displayMessage', 
                content: 'Code suggestion applied. Ready for next suggestion.' 
            });
        } catch (error) {
            console.error('Error applying code suggestion:', error);
            vscode.window.showErrorMessage('Failed to apply code suggestion.');
        }
    }

    /**
     * Reads the HTML file from the media folder and returns it as a string.
     * It also replaces placeholders with dynamic content like the current theme.
     *
     * @param {vscode.Webview} webview - The webview instance to generate content for.
     * @returns {string} The generated HTML string for the webview.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        const theme = getTheme();
        const initialTheme = theme === 0 ? 'light' : 'dark';

        const bootstrapCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'bootstrap.css'));
        const scriptJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'script.js'));

        const htmlFilePath = path.join(this.extensionUri.fsPath, 'media', 'index.html');

        let html = fs.readFileSync(htmlFilePath, 'utf8');

        // Get the default API from config
        const config = getConfig();
        const defaultApi = config.defaultApi;

        // Replace placeholders with dynamic content
        html = html.replace('${initialTheme}', initialTheme);
        html = html.replace('bootstrap.css', bootstrapCssUri.toString());
        html = html.replace('script.js', scriptJsUri.toString());
        html = html.replace('${defaultApi}', defaultApi.toString());

        return html;
    }

    private checkAndOpenSettingsPanel() {
        const config = getConfig();
        const apiNames = ['groq', 'openai', 'gemini'];
        const currentApi = apiNames[config.defaultApi];
        
        if (!config.api[currentApi].key || config.api[currentApi].key.trim() === '') {
            if (this._view) {
                this._view.webview.postMessage({ 
                    command: 'openSettingsPanel',
                    apiName: currentApi
                });
            }
        }
    }

    public focus() {
        if (this._view) {
            this._view.show(true); // `true` means give focus to the view
        }
    }
}