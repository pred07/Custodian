/**
 * Analyzer Service
 * 
 * Responsibilities:
 * - Coordinate analysis workflow
 * - Debounce analysis requests
 * - Publish diagnostics to LSP client
 * 
 * Delegates actual detection to the Engine.
 */

import { Connection, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TreeSitterParser } from '../engine/tree-sitter';
import { TaintAnalyzer } from '../engine/taint';
import { RuleManager } from '../rules/manifest';
import { TelemetryService } from './telemetry';

export class Analyzer {
    private parser: TreeSitterParser;
    private taintAnalyzer: TaintAnalyzer;
    private ruleManager: RuleManager;
    private telemetry: TelemetryService;
    private analysisTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly DEBOUNCE_MS = 300;

    constructor(private connection: Connection) {
        this.parser = new TreeSitterParser();
        this.ruleManager = new RuleManager();
        this.taintAnalyzer = new TaintAnalyzer(this.ruleManager);
        this.telemetry = new TelemetryService();
    }

    /**
     * Schedule analysis with debouncing
     * Only analyze after user stops typing for DEBOUNCE_MS
     */
    scheduleAnalysis(document: TextDocument): void {
        const uri = document.uri;

        // Clear existing timer
        const existingTimer = this.analysisTimers.get(uri);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Schedule new analysis
        const timer = setTimeout(() => {
            this.analyzeDocument(document);
            this.analysisTimers.delete(uri);
        }, this.DEBOUNCE_MS);

        this.analysisTimers.set(uri, timer);
    }

    /**
     * Perform immediate analysis
     */
    analyzeDocument(document: TextDocument): void {
        const startTime = Date.now();
        this.connection.console.log(`Analyzing: ${document.uri}`);

        try {
            // Step 1: Parse with Tree-sitter
            const tree = this.parser.parse(document.getText());

            if (!tree) {
                this.connection.console.error('Failed to parse document');
                return;
            }

            // Step 2: Find vulnerabilities (sink-first)
            const findings = this.taintAnalyzer.analyze(tree, document);

            // Step 3: Convert to LSP diagnostics AND Log Telemetry
            const diagnostics: Diagnostic[] = findings.map(finding => {
                // Track detection
                this.telemetry.trackDetection(finding.vulnerabilityType, document.getText(finding.range));

                return {
                    severity: finding.confidence === 'high'
                        ? DiagnosticSeverity.Error
                        : DiagnosticSeverity.Warning,
                    range: finding.range,
                    message: finding.message,
                    source: 'secure-coding',
                    code: finding.vulnerabilityType,
                };
            });

            // Step 4: Publish to client
            this.connection.sendDiagnostics({
                uri: document.uri,
                diagnostics,
            });

            const elapsed = Date.now() - startTime;
            this.connection.console.log(
                `Analysis complete: ${findings.length} findings in ${elapsed}ms`
            );

        } catch (error) {
            this.connection.console.error(`Analysis error: ${error}`);
        }
    }
}
