# Contributing to Secure Code Assistant

We welcome contributions from the community! This project aims to build a robust, self-updating secure coding assistant.

## Rule Development

Vulnerability rules are stored in `server/data/rules`.

- **Core Rules**: `server/data/rules/core/` (Standard language features)
- **Framework Rules**: `server/data/rules/frameworks/` (Django, Flask, etc.)

### Rule Format
Rules are defined in YAML:
```yaml
id: my-new-rule
name: My New Vulnerability Rule
severity: high | medium | low
description: One sentence description.
sinks: ["dangerous_function"]
sources: ["user_input"]
confidence: experimental
```

## Testing

We have a custom testing framework in `server/test`.

1.  **Fixtures**: Add test cases to `server/test/fixtures/`.
    - `vulnerable/`: Files that MUST trigger a detection.
    - `benign/`: Files that MUST NOT trigger a detection.
2.  **Running Tests**:
    ```bash
    npm run test-rules
    # or
    npx ts-node server/test/runner.ts
    ```

## AI Rule Generation

You can use our AI tool to generate rules from CVE descriptions (requires Groq API key).

1.  Copy `.env.example` to `.env` and add your `GROQ_API_KEY`.
2.  Run the script:
    ```bash
    python scripts/generate-rules-from-cve.py "CVE description here..."
    ```
3.  Generated rules are saved to `server/data/rules/experimental/`.

## Reporting Issues

- **False Positives/Negatives**: Use the "Report False Negative" command in VS Code.
- **Bugs**: Open an issue on GitHub.
