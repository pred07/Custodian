/**
 * AST Traversal Utilities
 * 
 * Helper functions for navigating Tree-sitter AST nodes
 */

import Parser from 'tree-sitter';

export class ASTTraverser {
    /**
     * Find all nodes matching a predicate
     */
    static findNodes(
        node: Parser.SyntaxNode,
        predicate: (node: Parser.SyntaxNode) => boolean
    ): Parser.SyntaxNode[] {
        const results: Parser.SyntaxNode[] = [];

        const traverse = (current: Parser.SyntaxNode) => {
            if (predicate(current)) {
                results.push(current);
            }

            for (const child of current.children) {
                traverse(child);
            }
        };

        traverse(node);
        return results;
    }

    /**
     * Find nodes by type (e.g., "call", "identifier")
     */
    static findByType(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode[] {
        return this.findNodes(node, (n) => n.type === type);
    }

    /**
     * Get text content of a node
     */
    static getText(node: Parser.SyntaxNode, sourceCode: string): string {
        return sourceCode.substring(node.startIndex, node.endIndex);
    }

    /**
     * Check if node is a function call matching a pattern
     * Example: "cursor.execute" matches node with attribute "cursor" and function "execute"
     */
    static isCallMatching(
        node: Parser.SyntaxNode,
        pattern: string,
        sourceCode: string
    ): boolean {
        if (node.type !== 'call') return false;

        const functionNode = node.childForFieldName('function');
        if (!functionNode) return false;

        const functionText = this.getText(functionNode, sourceCode);
        const matches = functionText === pattern || functionText.endsWith(`.${pattern}`);

        console.log(`      isCallMatching: "${functionText}" vs "${pattern}" = ${matches}`);

        return matches;
    }

    /**
     * Get arguments of a call expression
     */
    static getCallArguments(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
        if (node.type !== 'call') return [];

        const argsNode = node.childForFieldName('arguments');
        if (!argsNode) return [];

        return argsNode.namedChildren;
    }

    /**
     * Find parent node of a specific type
     */
    static findParent(
        node: Parser.SyntaxNode,
        type: string
    ): Parser.SyntaxNode | null {
        let current = node.parent;
        while (current) {
            if (current.type === type) return current;
            current = current.parent;
        }
        return null;
    }
}
