# Custodian

**Experimental Python-focused secure-coding diagnostics for VS Code.** Custodian uses a VS Code extension client and a local TypeScript Language Server Protocol (LSP) service to parse open Python documents, evaluate YAML rules, and publish editor diagnostics.

> **Status:** prototype. The repository does not currently support the broad IDE or language coverage described in earlier copy. The editor client activates for Python only, the parser uses the Python Tree-sitter grammar, and the rules are heuristic rather than a complete security analysis.

## Capabilities in this source snapshot

- Parses open Python documents with Tree-sitter and analyzes them after a 300 ms edit debounce.
- Loads five core YAML rules covering command injection, potential hardcoded secrets, insecure CSP settings, path traversal, and SQL injection.
- Publishes findings through LSP diagnostics with confidence-based severity mapping.
- Provides rule-based code actions where a matching fix template exists. The checked-in fix catalog currently covers SQL injection only.
- Includes separate developer scripts for importing community rules and generating experimental YAML from a CVE description.

See [Architecture](docs/ARCHITECTURE.md), [Rule and finding reference](docs/RULES_AND_FINDINGS.md), and [Privacy and data flows](docs/PRIVACY_AND_DATA.md) for implementation details and limitations.

## Install and run from source

Requirements: Node.js 18 or later and VS Code 1.85 or later. In a terminal at the repository root:

```bash
cd server && npm ci && npm run build
cd ../client && npm ci && npm run build
```

Open the **Custodian repository root** in VS Code and press **F5** to launch the Extension Development Host. Open a Python file to activate analysis. The server/client launch configuration and package layout are documented in [Development](docs/DEVELOPMENT.md).

The repository currently contains no packaged `.vsix` release. The root has no `LICENSE` file, so the README badge in older copy should not be treated as a complete license grant.

## Privacy and network behavior

Document parsing and analysis run in the local extension process. The current analyzer also writes detection metadata to a local file under `~/.secure-code-assistant/telemetry.json`; the visible `secureCode.telemetry` setting is not wired to that service in this snapshot. The telemetry service stores a rule ID, timestamp, and SHA-256 hash of the finding snippet; no telemetry upload path is present in the checked-in service.

The separate CVE rule-generation script sends the supplied CVE description to Groq when run with a Groq API key. It is a developer utility, not part of normal editor analysis. The updater makes a metadata request to a configured URL, but the current implementation does not download or apply rule assets. Review [Privacy and data flows](docs/PRIVACY_AND_DATA.md) before using this prototype with sensitive code.

## Supported environment

| Area | Current repository evidence |
|---|---|
| Editor client | VS Code extension |
| Activated language | Python only (`onLanguage:python`) |
| Parser | Tree-sitter Python grammar |
| Analysis | Sink-first, intra-procedural heuristic checks |
| Rule format | YAML files in `server/data/rules/core/` and `frameworks/` |
| Quick fixes | Template-based; current catalog is SQL injection focused |
| Other editors/languages | Not established by the checked-in client or parser configuration |

## Reference guides

- [Architecture](docs/ARCHITECTURE.md)
- [Privacy and data flows](docs/PRIVACY_AND_DATA.md)
- [Rule and finding reference](docs/RULES_AND_FINDINGS.md)
- [Development and validation](docs/DEVELOPMENT.md)
- [Setup](docs/SETUP.md)
- [Quick start](docs/QUICKSTART.md)
- [How to run](docs/HOW_TO_RUN.md)
- [Quick fixes](docs/QUICK_FIX.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Extension not loading](docs/EXTENSION_NOT_LOADING.md)

## License

No root `LICENSE` file is included in this repository snapshot. Confirm the intended license before redistributing the project.
