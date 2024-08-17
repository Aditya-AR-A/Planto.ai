import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

class AIContext {
    private activeEditor: vscode.TextEditor | undefined;
    private workspaceFolder: vscode.WorkspaceFolder | undefined;
    private directory: string | undefined;
    private savedContext: string;

    constructor() {
        this.initializeEditorAndWorkspace();
        this.savedContext = this.generateContext();
    }

    private initializeEditorAndWorkspace(): void {
        this.activeEditor = vscode.window.activeTextEditor;
        if (this.activeEditor) {
            this.workspaceFolder = vscode.workspace.getWorkspaceFolder(this.activeEditor.document.uri);
            this.directory = this.workspaceFolder ? this.workspaceFolder.uri.fsPath : path.dirname(this.activeEditor.document.uri.fsPath);
        }
    }

    private generateContext(): string {
        if (!this.activeEditor || !this.directory) {
            return 'Context:\nNo active file\n';
        }

        let context = 'Context:\n';
        context += this.getLanguageInfo();
        context += this.getDirectoryTree();
        context += this.getFileStructures();

        return this.truncateContext(context);
    }

    private getLanguageInfo(): string {
        const activeFilePath = this.activeEditor!.document.uri.fsPath;
        const fileExtension = path.extname(activeFilePath).toLowerCase();
        const languageMap: { [key: string]: string } = {
            '.js': 'JavaScript', 
            '.ts': 'TypeScript', 
            '.py': 'Python', 
            '.java': 'Java',
            '.html': 'HTML', 
            '.css': 'CSS', 
            '.cpp': 'C++', 
            '.c': 'C',
            '.scala': 'Scala', 
            '.rb': 'Ruby', 
            '.php': 'PHP', 
            '.go': 'Go',
            '.rs': 'Rust', 
            '.swift': 'Swift', 
            '.kt': 'Kotlin', 
            '.m': 'Objective-C',
            '.cs': 'C#', 
            '.vb': 'Visual Basic', 
            '.pl': 'Perl', 
            '.lua': 'Lua'
        };
        const language = languageMap[fileExtension] || 'Unknown';
        return `Language: ${language}\n`;
    }

    private getDirectoryTree(): string {
        let tree = 'Directory Tree:\n';
        const addDirectoryTree = (currentPath: string, indentLevel = 0) => {
            try {
                const items = fs.readdirSync(currentPath);
                items.forEach(item => {
                    const itemPath = path.join(currentPath, item);
                    const isDirectory = fs.lstatSync(itemPath).isDirectory();
                    tree += ' '.repeat(indentLevel * 2) + item + (isDirectory ? '/' : '') + '\n';
                    if (isDirectory) {
                        addDirectoryTree(itemPath, indentLevel + 1);
                    }
                });
            } catch (error) {
                console.error(`Error reading directory ${currentPath}:`, error);
                tree += ' '.repeat(indentLevel * 2) + `Error reading directory: ${error}\n`;
            }
        };
        addDirectoryTree(this.directory!);
        return tree;
    }

    private getFileStructures(): string {
        let structures = '';
        try {
            const files = fs.readdirSync(this.directory!);
            files.forEach(file => {
                const filePath = path.join(this.directory!, file);
                const fileExtension = path.extname(filePath);
                if (['.js', '.ts', '.py', '.scala', '.c', '.java', '.rb', '.php', '.go', '.rs', '.swift', '.kt', '.cs'].includes(fileExtension)) {
                    structures += this.extractFileStructure(filePath);
                }
            });
        } catch (error) {
            console.error(`Error reading directory ${this.directory}:`, error);
            structures += `Error reading directory: ${error}\n`;
        }
        return structures;
    }

    private extractFileStructure(filePath: string): string {
        let structure = '';
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const fileName = path.basename(filePath);
            structure += `File: ${fileName}\n`;

            const patterns = [
                { regex: /(?:class|trait|interface)\s+(\w+)(?:\s+(?:extends|implements)\s+(?:\w+(?:,\s*\w+)*))?\s*{/g, type: 'Class/Trait/Interface' },
                { regex: /(?:def|function|func)\s+(\w+)\s*\([^)]*\)\s*(?:->|\{|:)/g, type: 'Function/Method' },
                { regex: /(?:let|var|const)\s+(\w+)\s*(?:=|:)/g, type: 'Variable' }
            ];

            patterns.forEach(({ regex, type }) => {
                let match;
                while ((match = regex.exec(fileContent)) !== null) {
                    structure += `  ${type}: ${match[1]}\n`;
                }
            });
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            structure += `  Error reading file: ${error}\n`;
        }
        return structure;
    }

    private truncateContext(context: string): string {
        const maxLength = 4096;
        if (context.length > maxLength) {
            return context.substring(0, maxLength) + '...(truncated)';
        }
        return context;
    }

    public getCode(): string {
        if (!this.activeEditor) {
            return 'No active file\n';
        }

        const activeDocument = this.activeEditor.document;
        const cursorPosition = this.activeEditor.selection.active;
        const startLine = Math.max(0, cursorPosition.line - 100);
        const endLine = Math.min(activeDocument.lineCount - 1, cursorPosition.line + 50);

        const codeRange = new vscode.Range(startLine, 0, endLine, activeDocument.lineAt(endLine).range.end.character);
        const code = activeDocument.getText(codeRange);

        return `Code:\n${code}`;
    }

    public getContext(): string {
        return this.savedContext;
    }

    public getPrompt(type: number = 0): string {
        const code = this.getCode();

        switch (type) {
            case 1:
                return `${code}\n${this.getContext()}`;
            case 2:
                return code;
            default:
                return `${code}\n${this.savedContext}`;
        }
    }
}

export { AIContext };