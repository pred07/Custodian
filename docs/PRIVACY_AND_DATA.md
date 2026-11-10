# Privacy and Data Flows

## Editor analysis

The extension sends open document text from VS Code to its local language-server process over IPC. The analyzer parses that text locally and publishes diagnostics back to the editor. No code upload path is present in the checked-in analysis service.

## Local telemetry behavior

The analyzer calls `TelemetryService.trackDetection` for each finding. The service writes an event to `~/.secure-code-assistant/telemetry.json` containing the rule identifier, timestamp, and SHA-256 hash of the finding snippet. It keeps up to 100 events locally. This hash is not a guarantee of anonymity; predictable snippets can be guessed and hashed.

The VS Code setting `secureCode.telemetry` defaults to `false`, but the current telemetry service does not read that setting: its `enabled` field defaults to `true`. In this source snapshot, the setting therefore does not disable local event storage. No remote telemetry transmission is implemented in this class. Do not describe the current behavior as opt-in telemetry until the wiring is corrected and verified.

## Separate developer utilities

- `scripts/generate-rules-from-cve.py` sends the supplied CVE description to the Groq API when invoked. Do not pass confidential incident details or proprietary code to this tool.
- `scripts/sync-semgrep-rules.ts` retrieves community rule data from an external repository.
- The language-server updater requests release metadata from its configured URL. The default URL contains a `YOUR_ORG` placeholder, and the current code does not download or apply release assets.

These are distinct from normal editor analysis. External network access can occur when the utilities or updater run.

## Local files

Telemetry JSON is stored under the user's home directory. Rule files and the source tree are local. API credentials for the Groq utility belong in an ignored local environment file, never in Git or documentation.

## Recommended use

Review local telemetry behavior before installing the extension on a sensitive workstation. Treat rule identifiers, timestamps, hashes, logs, and prompts as potentially sensitive metadata. Check all developer-tool inputs before sending them to external providers.
