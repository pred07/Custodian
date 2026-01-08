import * as fs from 'fs';
import * as path from 'path';
import { TreeSitterParser } from '../src/engine/tree-sitter';
import { TaintAnalyzer } from '../src/engine/taint';
import { RuleManager } from '../src/rules/manifest';
import { TextDocument } from 'vscode-languageserver-textdocument';

async function runTests() {
    console.log('Initialize Testing Framework...');

    const parser = new TreeSitterParser();
    const ruleManager = new RuleManager();
    const analyzer = new TaintAnalyzer(ruleManager);

    const fixturesDir = path.join(__dirname, 'fixtures');
    const vulnerableDir = path.join(fixturesDir, 'vulnerable');
    const benignDir = path.join(fixturesDir, 'benign');

    let passed = 0;
    let failed = 0;

    // Helper to analyze file
    const analyzeFile = (filePath: string) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const tree = parser.parse(content);

        // Mock document
        const document = TextDocument.create(
            `file://${filePath}`,
            'python',
            1,
            content
        );

        if (!tree) {
            console.error(`Failed to parse ${path.basename(filePath)}`);
            return [];
        }

        return analyzer.analyze(tree, document);
    };

    console.log('\n--- Testing Vulnerable Files ---');
    if (fs.existsSync(vulnerableDir)) {
        for (const file of fs.readdirSync(vulnerableDir)) {
            if (!file.endsWith('.py')) continue;

            console.log(`Testing ${file}...`);
            const findings = analyzeFile(path.join(vulnerableDir, file));

            if (findings.length > 0) {
                console.log(`  ✅ Passed (Found ${findings.length} issues)`);
                passed++;
            } else {
                console.error(`  ❌ Failed (Expected issues, found none)`);
                failed++;
            }
        }
    }

    console.log('\n--- Testing Benign Files ---');
    if (fs.existsSync(benignDir)) {
        for (const file of fs.readdirSync(benignDir)) {
            if (!file.endsWith('.py')) continue;

            console.log(`Testing ${file}...`);
            const findings = analyzeFile(path.join(benignDir, file));

            if (findings.length === 0) {
                console.log(`  ✅ Passed (Found 0 issues)`);
                passed++;
            } else {
                console.error(`  ❌ Failed (Expected 0 issues, found ${findings.length})`);
                findings.forEach(f => console.log(`     - ${f.message}`));
                failed++;
            }
        }
    }

    console.log('\n-----------------------------------');
    console.log(`Total: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);

    if (failed > 0) process.exit(1);
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
