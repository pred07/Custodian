/**
 * VS Code Extension Client
 * 
 * Responsibilities:
 * - Activate LSP client
 * - Connect to LSP server
 * - Handle extension lifecycle
 * 
 * This is intentionally THIN - all logic is in the server.
 */

import * as path from 'path';
import { workspace, ExtensionContext, commands, env, Uri } from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    console.log('Secure Coding extension activating...');

    // Register Report False Negative command
    context.subscriptions.push(
        commands.registerCommand('secureCode.reportFalseNegative', () => {
            // Open GitHub Issues page
            env.openExternal(Uri.parse('https://github.com/YOUR_ORG/secure-rules/issues/new?template=false_negative.md&title=False+Negative+Report'));
        })
    );

    // Path to the compiled server
    const serverModule = context.asAbsolutePath(
        path.join('..', 'server', 'dist', 'server.js')
    );

    console.log('Server module path:', serverModule);

    // Server debug options
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // Server configuration
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions,
        },
    };

    // Client configuration
    const clientOptions: LanguageClientOptions = {
        // Only activate for Python files
        documentSelector: [{ scheme: 'file', language: 'python' }],
        synchronize: {
            // Notify server of configuration changes
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
        },
    };

    // Create and start the client
    client = new LanguageClient(
        'secureCodingLSP',
        'Secure Coding LSP',
        serverOptions,
        clientOptions
    );

    console.log('Starting LSP client...');

    // Start the client (also starts the server)
    client.start().then(() => {
        console.log('LSP client started successfully');
    }).catch((error) => {
        console.error('Failed to start LSP client:', error);
    });
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
