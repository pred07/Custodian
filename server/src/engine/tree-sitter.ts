/**
 * Tree-sitter Parser Wrapper
 * 
 * Responsibilities:
 * - Initialize Tree-sitter with Python grammar
 * - Parse source code into AST
 * - Handle incremental parsing
 * - Tolerate incomplete/broken syntax
 */

import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';

export class TreeSitterParser {
    private parser: Parser;

    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(Python);
    }

    /**
     * Parse source code into AST
     * Tree-sitter handles incomplete syntax gracefully
     */
    parse(sourceCode: string): Parser.Tree | null {
        try {
            return this.parser.parse(sourceCode);
        } catch (error) {
            console.error('Parse error:', error);
            return null;
        }
    }

    /**
     * Incremental parse (future optimization)
     * Reuses previous tree for faster parsing
     */
    parseIncremental(sourceCode: string, oldTree: Parser.Tree): Parser.Tree | null {
        try {
            return this.parser.parse(sourceCode, oldTree);
        } catch (error) {
            console.error('Incremental parse error:', error);
            return null;
        }
    }
}
