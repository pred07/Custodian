/**
 * Document Manager
 * 
 * Responsibilities:
 * - Track open documents
 * - Maintain document state
 * - Provide document lookup
 * 
 * Does NOT perform analysis - that's the Analyzer's job.
 */

import { Connection } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

export class DocumentManager {
    private documents: Map<string, TextDocument> = new Map();

    constructor(private connection: Connection) { }

    onDocumentOpened(document: TextDocument): void {
        this.documents.set(document.uri, document);
        this.connection.console.log(`Tracking document: ${document.uri}`);
    }

    onDocumentChanged(document: TextDocument): void {
        this.documents.set(document.uri, document);
    }

    onDocumentClosed(document: TextDocument): void {
        this.documents.delete(document.uri);
        this.connection.console.log(`Stopped tracking: ${document.uri}`);
    }

    getDocument(uri: string): TextDocument | undefined {
        return this.documents.get(uri);
    }

    getAllDocuments(): TextDocument[] {
        return Array.from(this.documents.values());
    }
}
