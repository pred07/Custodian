/**
 * Rule Manager
 * 
 * Responsibilities:
 * - Load vulnerability rules from YAML
 * - Provide rule lookup
 * - Validate rule schema
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export interface VulnerabilityRule {
    id: string;
    name: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    sinks: string[];        // Function patterns to watch (e.g., "execute", "eval")
    sources: string[];      // Taint sources (e.g., "request.args", "input")
    sanitizers?: string[];  // Functions that clean taint (e.g., "quote", "escape")
}

export class RuleManager {
    private rules: VulnerabilityRule[] = [];

    constructor() {
        this.loadRules();
    }

    /**
     * Load rules from YAML files in the versioned directory structure
     */
    private loadRules(): void {
        try {
            const rulesDir = path.join(__dirname, '../../data/rules');
            const coreDir = path.join(rulesDir, 'core');
            const frameworksDir = path.join(rulesDir, 'frameworks');

            const loadFromDir = (dir: string) => {
                if (!fs.existsSync(dir)) return;

                const files = fs.readdirSync(dir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
                for (const file of files) {
                    try {
                        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
                        const rule = yaml.parse(content);
                        // Handle both single rule object and array of rules (legacy compatibility)
                        if (rule.id) {
                            this.rules.push(rule as VulnerabilityRule);
                        } else if (Array.isArray(rule)) {
                            // If someone puts multiple rules in one file
                            this.rules.push(...(rule as VulnerabilityRule[]));
                        } else if (rule.rules && Array.isArray(rule.rules)) {
                            // Handle legacy wrapper
                            this.rules.push(...(rule.rules as VulnerabilityRule[]));
                        }
                    } catch (e) {
                        console.error(`Failed to parse rule file ${file}:`, e);
                    }
                }
            };

            loadFromDir(coreDir);
            loadFromDir(frameworksDir);

            console.log(`Loaded ${this.rules.length} vulnerability rules from versioned files.`);
            // this.rules.forEach(r => console.log(` - ${r.id} (${r.sinks.length} sinks)`));

        } catch (error) {
            console.error('Failed to load rules:', error);
            // Fallback to empty rules or legacy
            this.rules = [];
        }
    }

    /**
     * Get all loaded rules
     */
    getRules(): VulnerabilityRule[] {
        return this.rules;
    }

    /**
     * Get rule by ID
     */
    getRule(id: string): VulnerabilityRule | undefined {
        return this.rules.find(rule => rule.id === id);
    }
}
