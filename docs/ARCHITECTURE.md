# Architecture

## Runtime topology

```text
VS Code
  └─ client/src/extension.ts
       └─ LanguageClient (IPC)
            └─ server/src/server.ts
                 ├─ TextDocument lifecycle
                 ├─ TreeSitterParser (Python grammar)
                 ├─ TaintAnalyzer + RuleManager (YAML)
                 ├─ LSP diagnostics and code actions
                 └─ local telemetry JSON
```

## Analysis lifecycle

1. The client activates for documents whose language ID is Python.
2. The client starts the compiled server module over Node IPC.
3. The server receives document-open and document-change events through LSP.
4. Changes are debounced for 300 ms.
5. The Python Tree-sitter parser creates a syntax tree, including for incomplete editor buffers where possible.
6. `TaintAnalyzer` scans call expressions and assignments against loaded sink/source patterns. The implementation describes its tracing as intra-procedural and stops at function boundaries; it is not a general-purpose taint engine.
7. Findings become LSP diagnostics. A code action is offered only when a diagnostic has a matching loaded fix template.

## Repository components

| Path | Responsibility |
|---|---|
| `client/src/extension.ts` | VS Code activation, language selector, and LSP client process |
| `server/src/server.ts` | LSP lifecycle, diagnostics service wiring, and code-action handler |
| `server/src/engine/tree-sitter.ts` | Python grammar parser wrapper |
| `server/src/engine/taint.ts` | Sink-first heuristic analysis |
| `server/src/rules/manifest.ts` | Loads YAML rule definitions from core/framework directories |
| `server/src/fixProvider.ts` | Applies matching text-edit templates as LSP code actions |
| `server/src/services/telemetry.ts` | Local JSON event persistence |
| `scripts/` | Separate rule synchronization and CVE rule-generation tools |

## Network boundaries

Editor analysis uses local LSP IPC. Separate code paths can access external services: the rule updater fetches release metadata, the rule synchronization script fetches community rules, and the CVE generator calls Groq with the supplied description. The checked-in updater currently logs release metadata but does not download or install a rules archive.
