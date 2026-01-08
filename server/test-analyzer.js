/**
 * Standalone test script to verify the analysis engine works
 * Run with: node test-analyzer.js
 */

const { TreeSitterParser } = require('./dist/engine/tree-sitter');
const { TaintAnalyzer } = require('./dist/engine/taint');
const { RuleManager } = require('./dist/rules/manifest');

// Test code with SQL injection
const testCode = `
from flask import request
import sqlite3

def get_user(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    return cursor.fetchone()

def safe_query():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    return cursor.fetchall()
`;

console.log('🔍 Testing Secure Coding Analysis Engine\n');
console.log('Test Code:');
console.log('─'.repeat(50));
console.log(testCode);
console.log('─'.repeat(50));
console.log('\n');

try {
    // Initialize components
    const parser = new TreeSitterParser();
    const ruleManager = new RuleManager();
    const analyzer = new TaintAnalyzer(ruleManager);

    // Parse code
    console.log('📝 Parsing code with Tree-sitter...');
    const tree = parser.parse(testCode);

    if (!tree) {
        console.error('❌ Failed to parse code');
        process.exit(1);
    }
    console.log('✅ Parse successful\n');

    // Create mock document
    const mockDocument = {
        getText: () => testCode,
        positionAt: (offset) => {
            const lines = testCode.substring(0, offset).split('\n');
            return {
                line: lines.length - 1,
                character: lines[lines.length - 1].length
            };
        }
    };

    // Analyze
    console.log('🔎 Running vulnerability analysis...\n');
    const findings = analyzer.analyze(tree, mockDocument);

    // Report results
    console.log(`Found ${findings.length} potential vulnerabilities:\n`);

    findings.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding.vulnerabilityType.toUpperCase()}`);
        console.log(`   Message: ${finding.message}`);
        console.log(`   Confidence: ${finding.confidence}`);
        console.log(`   Line: ${finding.range.start.line + 1}`);
        console.log('');
    });

    if (findings.length === 0) {
        console.log('⚠️  No vulnerabilities detected (this might indicate an issue)');
    } else {
        console.log('✅ Analysis engine is working correctly!');
    }

} catch (error) {
    console.error('❌ Error during analysis:', error);
    console.error(error.stack);
    process.exit(1);
}
