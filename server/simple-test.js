#!/usr/bin/env node

/**
 * Simple test to verify analysis works
 */

const { TreeSitterParser } = require('./dist/engine/tree-sitter');
const { TaintAnalyzer } = require('./dist/engine/taint');
const { RuleManager } = require('./dist/rules/manifest');

const testCode = `from flask import request
import sqlite3

def get_user(user_id):
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
`;

const parser = new TreeSitterParser();
const ruleManager = new RuleManager();
const analyzer = new TaintAnalyzer(ruleManager);

const tree = parser.parse(testCode);
const mockDoc = {
    getText: () => testCode,
    positionAt: (offset) => {
        const lines = testCode.substring(0, offset).split('\n');
        return { line: lines.length - 1, character: lines[lines.length - 1].length };
    }
};

const findings = analyzer.analyze(tree, mockDoc);

console.log('RESULTS:');
console.log('Found', findings.length, 'vulnerabilities');
findings.forEach(f => {
    console.log('-', f.vulnerabilityType, ':', f.message, '(confidence:', f.confidence + ')');
});
