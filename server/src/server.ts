/**
 * LSP Server Entry Point
 * 
 * Responsibilities:
 * - Initialize LSP connection
 * - Handle lifecycle events (initialize, shutdown)
 * - Coordinate between document manager and analyzer
 */

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentManager } from './services/document-manager';
import { Analyzer } from './services/analyzer';

// Create LSP connection
const connection = createConnection(ProposedFeatures.all);

// Document manager (tracks open files)
const documents = new TextDocuments(TextDocument);

import { RuleUpdater } from './ruleUpdater';
import { FixProvider } from './fixProvider';

// Core services
let documentManager: DocumentManager;
let analyzer: Analyzer;
let ruleUpdater: RuleUpdater;
let fixProvider: FixProvider;

connection.onInitialize((params: InitializeParams): InitializeResult => {
    connection.console.log('Secure Coding LSP Server initializing...');

    // Initialize services
    documentManager = new DocumentManager(connection);
    analyzer = new Analyzer(connection);
    ruleUpdater = new RuleUpdater(connection);
    fixProvider = new FixProvider();

    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: TextDocumentSyncKind.Incremental,
            },
            codeActionProvider: true
        },
    };
});

connection.onCodeAction((params) => {
    try {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];

        return fixProvider.provideCodeActions(document, params.range, params.context.diagnostics);
    } catch (e) {
        connection.console.error(`Code Action error: ${e}`);
        return [];
    }
});

connection.onInitialized(() => {
    connection.console.log('Secure Coding LSP Server initialized');
    ruleUpdater.start();
});

connection.onShutdown(() => {
    ruleUpdater.stop();
});

// Document lifecycle events
documents.onDidOpen((event) => {
    connection.console.log(`Document opened: ${event.document.uri}`);
    documentManager.onDocumentOpened(event.document);
    analyzer.analyzeDocument(event.document);
});

documents.onDidChangeContent((event) => {
    connection.console.log(`Document changed: ${event.document.uri}`);
    documentManager.onDocumentChanged(event.document);

    // Debounce: analyze after 300ms of no changes
    analyzer.scheduleAnalysis(event.document);
});

documents.onDidClose((event) => {
    connection.console.log(`Document closed: ${event.document.uri}`);
    documentManager.onDocumentClosed(event.document);
});

// Start listening
documents.listen(connection);
connection.listen();
