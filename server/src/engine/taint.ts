/**
 * Micro-Taint Analyzer
 * 
 * Responsibilities:
 * - Perform SINK-FIRST detection
 * - Trace data flow backward from sinks (intra-procedural only)
 * - Classify findings by confidence level
 * 
 * Constraints:
 * - No full taint analysis
 * - No inter-procedural analysis
 * - Stop at function boundaries
 */

import Parser from 'tree-sitter';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Range } from 'vscode-languageserver/node';
import { ASTTraverser } from './traverser';
import { RuleManager, VulnerabilityRule } from '../rules/manifest';

export interface Finding {
    vulnerabilityType: string;
    message: string;
    range: Range;
    confidence: 'high' | 'medium' | 'low';
}

export class TaintAnalyzer {
    constructor(private ruleManager: RuleManager) { }

    /**
     * Main analysis entry point
     * Implements SINK-FIRST strategy
     */
    analyze(tree: Parser.Tree, document: TextDocument): Finding[] {
        const findings: Finding[] = [];
        const sourceCode = document.getText();
        const rules = this.ruleManager.getRules();

        // For each vulnerability type, find sinks
        for (const rule of rules) {
            console.log(`Starting analysis for rule: ${rule.id}`);
            try {
                // Find sinks in function calls
                const callFindings = this.findSinksInCalls(tree.rootNode, rule, sourceCode, document);
                findings.push(...callFindings);

                // Find sinks in assignments (e.g., hardcoded secrets, CSP headers)
                const assignmentFindings = this.findSinksInAssignments(tree.rootNode, rule, sourceCode, document);
                findings.push(...assignmentFindings);

                console.log(`Finished rule ${rule.id}, found ${callFindings.length + assignmentFindings.length} issues`);
            } catch (err) {
                console.error(`Error analyzing rule ${rule.id}:`, err);
            }
        }

        return findings;
    }

    /**
     * Find all sinks for a specific vulnerability type
     */
    /**
     * Find sinks in function calls
     */
    private findSinksInCalls(
        rootNode: Parser.SyntaxNode,
        rule: VulnerabilityRule,
        sourceCode: string,
        document: TextDocument
    ): Finding[] {
        const findings: Finding[] = [];

        // Find all call expressions
        const calls = ASTTraverser.findByType(rootNode, 'call');

        for (const call of calls) {
            // Check if this call matches any sink pattern
            for (const sinkPattern of rule.sinks) {
                if (ASTTraverser.isCallMatching(call, sinkPattern, sourceCode)) {
                    // Found a sink! Now trace backward
                    const finding = this.analyzeSink(call, rule, sourceCode, document);
                    if (finding) {
                        findings.push(finding);
                    }
                }
            }
        }

        return findings;
    }

    /**
     * Find sinks in variable assignments
     */
    private findSinksInAssignments(
        rootNode: Parser.SyntaxNode,
        rule: VulnerabilityRule,
        sourceCode: string,
        document: TextDocument
    ): Finding[] {
        const findings: Finding[] = [];
        const assignments = ASTTraverser.findByType(rootNode, 'assignment');

        for (const assignment of assignments) {
            const leftNode = assignment.childForFieldName('left');
            const rightNode = assignment.childForFieldName('right');

            if (!leftNode || !rightNode) continue;

            const targetName = ASTTraverser.getText(leftNode, sourceCode);

            // Check if variable name is a sink
            for (const sinkPattern of rule.sinks) {
                if (targetName.includes(sinkPattern) || targetName === sinkPattern) {
                    // Check RHS for taint (sources)
                    const taintStatus = this.traceTaint(rightNode, rule, sourceCode);

                    if (taintStatus.isTainted) {
                        findings.push({
                            vulnerabilityType: rule.id,
                            message: `${rule.name}: ${taintStatus.reason}`,
                            range: this.nodeToRange(assignment, document),
                            confidence: taintStatus.confidence
                        });
                    }
                }
            }
        }

        return findings;
    }

    /**
     * Analyze a specific sink call
     * Trace arguments backward to determine if tainted
     */
    private analyzeSink(
        sinkNode: Parser.SyntaxNode,
        rule: VulnerabilityRule,
        sourceCode: string,
        document: TextDocument
    ): Finding | null {
        const args = ASTTraverser.getCallArguments(sinkNode);

        if (args.length === 0) return null;

        // Analyze first argument (most common case)
        const firstArg = args[0];
        const taintStatus = this.traceTaint(firstArg, rule, sourceCode);

        if (taintStatus.isTainted) {
            return {
                vulnerabilityType: rule.id,
                message: `${rule.name}: ${taintStatus.reason}`,
                range: this.nodeToRange(sinkNode, document),
                confidence: taintStatus.confidence,
            };
        }

        return null;
    }

    /**
     * Trace taint for a single expression
     * Returns whether the expression is tainted and why
     */
    private traceTaint(
        node: Parser.SyntaxNode,
        rule: VulnerabilityRule,
        sourceCode: string
    ): { isTainted: boolean; reason: string; confidence: 'high' | 'medium' | 'low' } {
        const nodeText = ASTTraverser.getText(node, sourceCode);

        // Case 1: Concatenation or String with Interpolation - CHECK COMPONENTS
        // Must check this BEFORE simple string check because f-strings are also type 'string'
        if (node.type === 'concatenated_string' || node.type === 'string') {
            const hasInterpolation = node.children.some(
                child => child.type === 'interpolation'
            );

            if (hasInterpolation) {
                // Check if interpolated values are tainted
                for (const child of node.children) {
                    if (child.type === 'interpolation') {
                        const innerExpr = child.namedChildren[0];
                        if (innerExpr) {
                            const innerTaint = this.traceTaint(innerExpr, rule, sourceCode);
                            if (innerTaint.isTainted) {
                                return {
                                    isTainted: true,
                                    reason: `Unsafe interpolation: ${innerTaint.reason}`,
                                    confidence: 'high',
                                };
                            }
                        }
                    }
                }

                // If it has interpolation but no tainted parts found
                // We should still be careful, but if parts are safe, it's safe.
                // However, we continue to check other cases?
                // Actually, if we checked all interpolations and they are safe, the string is safe.
            }
        }

        // Case 2: Simple String literal
        if (node.type === 'string' || node.type === 'integer') {
            const hasInterpolation = node.children.some(
                child => child.type === 'interpolation'
            );

            if (!hasInterpolation) {
                // Check if the string ITSELF is a source (e.g., "unsafe-inline")
                // Remove quotes for comparison
                const rawValue = nodeText.replace(/^['"]|['"]$/g, '');

                for (const sourcePattern of rule.sources) {
                    if (rawValue.includes(sourcePattern)) {
                        return {
                            isTainted: true,
                            reason: `Unsafe value '${rawValue}'`,
                            confidence: 'high'
                        };
                    }
                }

                return { isTainted: false, reason: 'Constant value', confidence: 'high' };
            }
        }

        // Case 3: Identifier - CHECK IF IT'S A SOURCE
        if (node.type === 'identifier') {
            const varName = nodeText;

            // Check if this matches a known source pattern
            for (const sourcePattern of rule.sources) {
                if (varName.includes(sourcePattern) || this.isKnownSource(varName)) {
                    return {
                        isTainted: true,
                        reason: `Untrusted input from '${varName}'`,
                        confidence: 'high',
                    };
                }
            }

            // Unknown identifier - could be tainted
            return {
                isTainted: true,
                reason: `Unvalidated variable '${varName}'`,
                confidence: 'medium',
            };
        }

        // Case 4: Attribute access (e.g., request.args)
        if (node.type === 'attribute') {
            const attrText = nodeText;

            for (const sourcePattern of rule.sources) {
                if (attrText.includes(sourcePattern)) {
                    return {
                        isTainted: true,
                        reason: `Untrusted input from '${attrText}'`,
                        confidence: 'high',
                    };
                }
            }
        }

        // Case 5: Function call - UNKNOWN (could be sanitizer or source)
        if (node.type === 'call') {
            const funcNode = node.childForFieldName('function');
            if (funcNode) {
                const funcName = ASTTraverser.getText(funcNode, sourceCode);

                // Check if it's a sanitizer
                for (const sanitizer of rule.sanitizers || []) {
                    if (funcName.includes(sanitizer)) {
                        return {
                            isTainted: false,
                            reason: `Sanitized by '${funcName}'`,
                            confidence: 'high',
                        };
                    }
                }
            }

            // Unknown function - conservative approach
            return {
                isTainted: true,
                reason: 'Function return value (unverified)',
                confidence: 'low',
            };
        }

        // Default: Treat as potentially tainted
        return {
            isTainted: true,
            reason: `Complex expression: ${nodeText.substring(0, 30)}...`,
            confidence: 'low',
        };
    }

    /**
     * Check if identifier name suggests it's user input
     */
    private isKnownSource(varName: string): boolean {
        const sourceKeywords = [
            'request', 'input', 'param', 'arg', 'query',
            'user', 'data', 'body', 'form', 'cookie'
        ];

        const lowerName = varName.toLowerCase();
        return sourceKeywords.some(keyword => lowerName.includes(keyword));
    }

    /**
     * Convert Tree-sitter node position to LSP Range
     */
    private nodeToRange(node: Parser.SyntaxNode, document: TextDocument): Range {
        return {
            start: document.positionAt(node.startIndex),
            end: document.positionAt(node.endIndex),
        };
    }
}
