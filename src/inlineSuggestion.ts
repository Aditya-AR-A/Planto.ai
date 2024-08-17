import * as vscode from 'vscode';
import { getResponse } from './getSuggestion';

let inlineCompletionProvider: vscode.Disposable | undefined;

export function startInlineSuggestions(context: vscode.ExtensionContext) {
    console.log('>>> Start Inline Suggestions');
    
    inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, {
        provideInlineCompletionItems: async (document, position, context, token) => {
            // Check for diagnostics at the current position
            const diagnostics = vscode.languages.getDiagnostics(document.uri);
            const hasErrorAtPosition = diagnostics.some(diagnostic => 
                diagnostic.severity === vscode.DiagnosticSeverity.Error &&
                diagnostic.range.contains(position)
            );

            if (!hasErrorAtPosition) {
                return []; // No error, don't provide suggestions
            }

            const suggestion = await getResponse(2);
            
            if (suggestion) {
                return [
                    {
                        insertText: suggestion,
                        range: new vscode.Range(position, position)
                    }
                ];
            }
            return [];
        }
    });

    context.subscriptions.push(inlineCompletionProvider);
}

export function stopInlineSuggestions() {
    console.log('>>> Stop Inline Suggestions');
    if (inlineCompletionProvider) {
        inlineCompletionProvider.dispose();
        inlineCompletionProvider = undefined;
    }
}