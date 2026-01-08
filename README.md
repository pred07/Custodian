# Live Secure Code Assistant

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Status](https://img.shields.io/badge/status-active-green)
![Community](https://img.shields.io/badge/governance-community--driven-orange)

A real-time secure coding assistant for VS Code that detects vulnerabilities as you type. Now powered by community-sourced rules and AI.

## Features

*   **Real-time Vulnerability Detection**: Instant feedback on SQL injection, command injection, and more.
*   **Auto-Updating Rules**: Fetches the latest security rules from the community each week.
*   **Quick Fixes**: Automated code replacements for common vulnerabilities (e.g., parameterized queries).
*   **AI-Powered**: Experimental support for generating rules from CVE descriptions.
*   **Privacy-First Telemetry**: Opt-in sharing of anonymized detection data to improve rule accuracy.
*   **Keystroke-Time Detection**: Analyzes code <100ms after you stop typing.
*   **Sink-First Analysis**: Extremely fast detection by focusing only on dangerous function calls (sinks).
*   **IDE Agnostic**: Built on the **Language Server Protocol (LSP)**, compatible with VS Code, Neovim, IntelliJ, etc.
*   **Privacy-First**: Runs 100% locally. No code is sent to the cloud.
*   **No False Positive Spam**: Explicit confidence levels (`High`, `Medium`, `Low`) to build trust.

## 🛡️ Supported Vulnerabilities

| Vulnerability | Detection Logic | Example |
| :--- | :--- | :--- |
| **SQL Injection** | Detects string interpolation in SQL queries | `cursor.execute(f"SELECT * FROM users WHERE id={id}")` |
| **Command Injection** | Detects user input in system commands | `os.system(f"ping {ip}")` |
| **Path Traversal** | Detects user input in file paths | `open(f"/var/www/{filename}")` |
| **Hardcoded Secrets** | Detects hardcoded passwords/keys | `api_key = "sk-12345..."` |

## 🛠️ Architecture

The system is split into two components:

1.  **LSP Server (`server/`)**: The "brain".
    *   Written in TypeScript (Node.js).
    *   Uses **Tree-sitter** for robust parsing of incomplete code.
    *   Implements a custom **Micro-Taint Analyzer** for finding dirty data flows.
2.  **LSP Client (`client/`)**: The "thin" UI.
    *   Standard VS Code extension.
    *   Simply launches the server and displays diagnostics.

## 📦 Installation & Usage

### Prerequisites
*   Node.js (v18+)
*   VS Code

### Setup
1.  **Clone & Build**:
    ```bash
    # Install dependencies
    cd server && npm install
    cd ../client && npm install

    # Build everything
    cd ../server && npm run build
    cd ../client && npm run build
    ```

2.  **Run in VS Code**:
    *   Open the root `secure code` folder in VS Code.
    *   Press **F5** (Select "Launch Extension").
    *   A new "Extension Development Host" window will open.

3.  **Test**:
    *   Open a Python file.
    *   Type vulnerable code (e.g., `import os; os.system(input())`).
    *   Wait 300ms.
    *   See the red squiggle and warning!

## �️ Development Tools

### AI Rule Generator
Generate new rules from CVE descriptions using AI (requires `GROQ_API_KEY` in `.env`):
```bash
python scripts/generate-rules-from-cve.py "CVE-2023-XXXX: SQL injection in..."
```

### External Rule Sync
Sync rules from the Semgrep community repository:
```bash
npx ts-node scripts/sync-semgrep-rules.ts
```

### Reporting Issues
If you find a false positive or negative, use the VS Code command:
**"Secure Code: Report False Negative"**
This will open a GitHub issue template with the necessary details.

## �🔧 Configuration

Vulnerabilities are defined in `server/data/rules/core/*.yml`. You can add new rules or modify existing ones there.

```yaml
id: sql-injection
name: SQL Injection
severity: high
sinks: ["execute", "executemany"]
sources: ["request.args", "socket.recv"]
confidence: high
```

## 🧪 Testing

Run the comprehensive test suite to validate rules against vulnerable and benign fixtures:
```bash
npx ts-node server/test/runner.ts
```

## 📝 License
MIT
