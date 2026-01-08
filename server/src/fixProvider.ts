import * as fs from 'fs';
import * as path from 'path';
import {
    CodeAction,
    CodeActionKind,
    Diagnostic,
    TextDocumentEdit,
    TextEdit,
    Range,
    WorkspaceEdit,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

interface FixTemplate {
    id: string;
    vulnerability_id: string;
    confidence: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    pattern: string;
    replacement: string;
}

export class FixProvider {
    private fixes: FixTemplate[] = [];

    constructor() {
        this.loadFixes();
    }

    private loadFixes() {
        const fixesDir = path.join(__dirname, '../data/fixes');
        if (!fs.existsSync(fixesDir)) return;

        const files = fs.readdirSync(fixesDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(fixesDir, file), 'utf-8');
                const yaml = require('yaml');
                const parsed = yaml.parse(content);
                if (parsed && Array.isArray(parsed.fixes)) {
                    this.fixes.push(...parsed.fixes);
                }
            } catch (e) {
                console.error(`Failed to load fixes from ${file}:`, e);
            }
        }
        console.log(`Loaded ${this.fixes.length} fix templates.`);
    }

    public provideCodeActions(document: TextDocument, range: Range, diagnostics: Diagnostic[]): CodeAction[] {
        const actions: CodeAction[] = [];

        for (const diagnostic of diagnostics) {
            const ruleId = diagnostic.code;
            if (!ruleId) continue;

            const applicableFixes = this.fixes.filter(f => f.vulnerability_id === ruleId);

            for (const fix of applicableFixes) {
                const text = document.getText(diagnostic.range);
                const regex = new RegExp(fix.pattern);
                const match = regex.exec(text);

                if (match) {
                    let newText = fix.replacement;
                    for (let i = 1; i < match.length; i++) {
                        newText = newText.replace(`$${i}`, match[i]);
                    }

                    const action: CodeAction = {
                        title: fix.title,
                        kind: CodeActionKind.QuickFix,
                        diagnostics: [diagnostic],
                        edit: {
                            changes: {
                                [document.uri]: [
                                    TextEdit.replace(diagnostic.range, newText)
                                ]
                            }
                        },
                        isPreferred: fix.confidence === 'high'
                    };
                    actions.push(action);
                }
            }
        }

        return actions;
    }
}
