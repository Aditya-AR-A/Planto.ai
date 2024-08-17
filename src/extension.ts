import * as vscode from 'vscode';
import { SidebarViewProvider } from './sidebar';
import { startInlineSuggestions, stopInlineSuggestions } from './inlineSuggestion';
import { getConfig, setConfig } from './misscellaneous';
import { Diagnostic } from 'vscode';

let currentDiagnostic: Diagnostic | undefined;

export function activate(context: vscode.ExtensionContext) {
    const config = getConfig();

    // SECTION: Sidebar Provider
    const sidebarProvider = new SidebarViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarViewProvider.viewType,
            sidebarProvider
        )
    );

    // Register the adcopilot.focus command
    context.subscriptions.push(
        vscode.commands.registerCommand('adcopilot.focus', () => {
            sidebarProvider.focus();
        })
    );

    // SECTION: Inline Suggestions
    // Use workspaceState to persist inlineSuggestionsActive
    let inlineSuggestionsActive = context.workspaceState.get<boolean>('inlineSuggestionsActive', config.inlineSuggestion === 1);
    if (inlineSuggestionsActive) {
        startInlineSuggestions(context);
    }

    // Toggle inline suggestions command
    context.subscriptions.push(
        vscode.commands.registerCommand('adcopilot.toggleInlineSuggestions', (checked: boolean) => {
            inlineSuggestionsActive = checked;
            if (checked) {
                startInlineSuggestions(context);
            } else {
                stopInlineSuggestions();
            }
            setConfig('inlineSuggestion', checked ? 1 : 0);
            // Update workspaceState
            context.workspaceState.update('inlineSuggestionsActive', checked);
        })
    );

    // SECTION: Diagnostics and Hover Provider
    // Create and register diagnostics collection
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("myExtension");
    context.subscriptions.push(diagnosticCollection);

    // Register a hover provider for all file types
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('*', {
            provideHover(document, position, token) {
                // Get all diagnostics for the current file
                const diagnostics = vscode.languages.getDiagnostics(document.uri);
                
                // Find a diagnostic at the current position
                const diagnostic = diagnostics.find(d => d.range.contains(position));
                
                if (diagnostic) {
                    // Store the current diagnostic
                    currentDiagnostic = diagnostic;

                    // Create custom hover message with a more prominent action
                    const hoverMessage = new vscode.MarkdownString();
                    hoverMessage.appendMarkdown(`**Error:** ${diagnostic.message}\n\n`);
                    hoverMessage.appendMarkdown('---\n\n');
                    hoverMessage.appendMarkdown(`💡 **[  AI Fix in Chat  ](command:adcopilot.aiFixInChat)**\n\n`);
                    hoverMessage.isTrusted = true;
                    
                    return new vscode.Hover(hoverMessage, diagnostic.range);
                }
                
                return null;
            }
        })
    );

    // SECTION: Commands
    // Register the AI Fix in Chat command
    context.subscriptions.push(
        vscode.commands.registerCommand('adcopilot.aiFixInChat', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            if (!currentDiagnostic) {
                vscode.window.showErrorMessage('No error selected. Please hover over an error and try again.');
                return;
            }

            const document = editor.document;

            console.log('Current diagnostic:', {
                message: currentDiagnostic.message,
                range: `${currentDiagnostic.range.start.line}:${currentDiagnostic.range.start.character} - ${currentDiagnostic.range.end.line}:${currentDiagnostic.range.end.character}`
            });

            // Prepare the prompt
            const prompt = `
            Error: ${currentDiagnostic.message}
            Code:
            \`\`\`${document.languageId}
            ${document.getText()}
            \`\`\`
            Please provide a fix for the error at line ${currentDiagnostic.range.start.line + 1}, column ${currentDiagnostic.range.start.character + 1}.
            `;

            console.log("4");

            try {
                // Open and focus the sidebar
                console.log("Attempting to open and focus sidebar...");
                sidebarProvider.focus();
                console.log("Sidebar opened and focused successfully");
            } catch (error) {
                console.error("Error opening sidebar:", error);
                vscode.window.showErrorMessage('Failed to open sidebar. Please try again or check the extension logs.');
                return;
            }

            console.log("5");

            // Send the prompt to the webview
            try {
                console.log("Attempting to send prompt to webview...");
                sidebarProvider.sendPromptToWebview(prompt);
                console.log("Prompt sent successfully");
            } catch (error) {
                console.error("Error sending prompt to webview:", error);
                vscode.window.showErrorMessage('Failed to send prompt to chat. Please try again or check the extension logs.');
            }

            // Reset the current diagnostic
            currentDiagnostic = undefined;
        })
    );

}

export function deactivate() {
    stopInlineSuggestions();
}