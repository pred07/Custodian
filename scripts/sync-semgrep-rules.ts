import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as yaml from 'js-yaml';

// Configuration
const SEMGREP_REPO_API = 'https://api.github.com/repos/returntocorp/semgrep-rules/contents/python';
const DEST_DIR = path.join(__dirname, '../server/data/rules/imported');

interface SemgrepRule {
    id: string;
    message: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    patterns?: any[];
    pattern?: any;
    'pattern-either'?: any[];
    metadata?: any;
}

interface OurRule {
    id: string;
    name: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    sinks: string[]; // Semgrep doesn'tmap directly, we might need manual review
    sources: string[];
    confidence: 'experimental';
    source: 'semgrep';
}

async function fetchRuleFiles(url: string): Promise<any[]> {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Secure-Code-LSP-Sync' }
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return [];
    }
}

async function processRule(url: string, filename: string) {
    try {
        const response = await axios.get(url);
        const content = response.data; // Raw YAML
        const parsed = yaml.load(content) as any;

        if (!parsed || !parsed.rules) return;

        for (const rule of parsed.rules) {
            // We only want Python rules for now (implied by directory)
            // We need to check if it's convertible
            // For strict taint mode, we need sources/sinks. 
            // Many semgrep rules are search-based.
            // For this task, we will convert metadata and set sinks/sources to "MANUAL_REVIEW"

            const newId = `semgrep-${rule.id}`;
            const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
                'ERROR': 'high',
                'WARNING': 'medium',
                'INFO': 'low'
            };

            const converted: OurRule = {
                id: newId,
                name: rule.id.replace(/-/g, ' '),
                severity: severityMap[rule.severity] || 'medium',
                description: rule.message,
                sinks: ['MANUAL_REVIEW'],
                sources: ['MANUAL_REVIEW'],
                confidence: 'experimental',
                source: 'semgrep'
            };

            // Save
            const outPath = path.join(DEST_DIR, `${newId}.yml`);
            fs.mkdirSync(DEST_DIR, { recursive: true });
            fs.writeFileSync(outPath, yaml.dump(converted));
            console.log(`Imported: ${newId}`);
        }

    } catch (error) {
        console.error(`Failed to process ${filename}:`, error);
    }
}

async function main() {
    console.log('Starting Semgrep rule sync...');
    const files = await fetchRuleFiles(SEMGREP_REPO_API);

    for (const file of files) {
        if (file.type === 'file' && (file.name.endsWith('.yml') || file.name.endsWith('.yaml'))) {
            // Get raw content URL
            await processRule(file.download_url, file.name);
            // Rate limit friendliness
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    console.log('Sync complete.');
}

main().catch(console.error);
