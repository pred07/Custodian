import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

interface TelemetryEvent {
    type: 'detection' | 'error';
    ruleId?: string;
    timestamp: string;
    hash?: string; // Anonymized data hash
}

export class TelemetryService {
    private storagePath: string;
    private events: TelemetryEvent[] = [];
    private readonly MAX_EVENTS = 100;
    private enabled: boolean = true; // Should ideally read from config

    constructor() {
        const homeDir = os.homedir();
        const appDir = path.join(homeDir, '.secure-code-assistant');

        if (!fs.existsSync(appDir)) {
            try {
                fs.mkdirSync(appDir, { recursive: true });
            } catch (e) {
                console.error('Failed to create telemetry dir:', e);
                this.enabled = false;
            }
        }

        this.storagePath = path.join(appDir, 'telemetry.json');
        this.loadEvents();
    }

    private loadEvents() {
        if (!this.enabled || !fs.existsSync(this.storagePath)) return;
        try {
            const data = fs.readFileSync(this.storagePath, 'utf-8');
            this.events = JSON.parse(data);
        } catch (e) {
            console.error('Failed to load telemetry:', e);
        }
    }

    public trackDetection(ruleId: string, snippet: string) {
        if (!this.enabled) return;

        // Hash the snippet to avoid storing user code
        const hash = crypto.createHash('sha256').update(snippet).digest('hex');

        this.events.push({
            type: 'detection',
            ruleId,
            timestamp: new Date().toISOString(),
            hash: hash
        });

        this.flush();
    }

    public trackError(error: string) {
        if (!this.enabled) return;

        this.events.push({
            type: 'error',
            timestamp: new Date().toISOString(),
            hash: error // Errors might be safe to store? Maybe hash them too if sensitive.
        });

        this.flush();
    }

    private flush() {
        if (!this.enabled) return;

        // Keep last MAX_EVENTS
        if (this.events.length > this.MAX_EVENTS) {
            this.events = this.events.slice(-this.MAX_EVENTS);
        }

        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(this.events, null, 2));
        } catch (e) {
            console.error('Failed to save telemetry:', e);
        }
    }
}
