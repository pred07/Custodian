# Setup Instructions

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **VS Code**: >= 1.85.0

## Installation

### 1. Install Server Dependencies

```bash
cd server
npm install
```

This installs:
- `vscode-languageserver` - LSP protocol implementation
- `tree-sitter` - Parser with error recovery
- `tree-sitter-python` - Python grammar
- `yaml` - Rule definition parsing

### 2. Build Server

```bash
cd server
npm run build
```

This compiles TypeScript to JavaScript in `server/dist/`.

### 3. Install Client Dependencies

```bash
cd client
npm install
```

This installs:
- `vscode-languageclient` - LSP client library

### 4. Build Client

```bash
cd client
npm run build
```

This compiles the VS Code extension to `client/dist/`.

## Running in Development

### Option 1: VS Code Extension Development Host

1. Open the project root in VS Code
2. Press `F5` to launch Extension Development Host
3. In the new window, open a Python file from `test-fixtures/`
4. Observe diagnostics appearing as you type

### Option 2: Manual Server Launch (for debugging)

Terminal 1 (Server):
```bash
cd server
npm run watch  # Recompiles on changes
```

Terminal 2 (Client):
```bash
cd client
npm run watch
```

Then press `F5` in VS Code.

## Testing

### Manual Testing

1. Open `test-fixtures/sql_injection.py`
2. Verify red squiggles appear under vulnerable `cursor.execute()` calls
3. Hover to see diagnostic message
4. Edit code to trigger re-analysis (debounced 300ms)

### Test Incomplete Syntax

1. Open `test-fixtures/incomplete_syntax.py`
2. Verify diagnostics still appear despite syntax errors
3. Try typing incomplete code:
   ```python
   cursor.execute(f"SELECT * FROM users WHERE id = {us
   ```
4. Diagnostic should appear even without closing brace

### Expected Behavior

**SQL Injection Test**:
- ✅ `get_user_vulnerable`: Error on line with `cursor.execute(query)`
- ✅ `search_vulnerable`: Error on line with string concatenation
- ❌ `get_user_safe`: No error (parameterized query)
- ❌ `get_all_users`: No error (no user input)

**Command Injection Test**:
- ✅ `ping_vulnerable`: Error on `os.system(f"ping...")`
- ✅ `backup_vulnerable`: Error on `subprocess.run(..., shell=True)`
- ✅ `calc_vulnerable`: Error on `eval(expression)`
- ❌ `ping_safe`: No error (list args, no shell)

**Path Traversal Test**:
- ✅ `download_vulnerable`: Error on `open(f"/var/www/uploads/{filename}")`
- ✅ `read_vulnerable`: Error on `open(path)`
- ❌ `download_safe`: No error (sanitized with `basename`)
- ❌ `get_config`: No error (hardcoded path)

## Troubleshooting

### "Cannot find module 'tree-sitter'"

**Solution**: Run `npm install` in `server/` directory.

### "Language server failed to start"

**Solution**: 
1. Check `server/dist/server.js` exists (run `npm run build`)
2. Check VS Code Output panel → "Secure Coding LSP"

### No diagnostics appearing

**Solution**:
1. Verify file is `.py` extension
2. Check VS Code Output → "Secure Coding LSP" for errors
3. Try saving file to trigger re-analysis

### Diagnostics delayed

**Expected**: 300ms debounce after typing stops. This is intentional.

## Configuration

### Adjusting Debounce Delay

Edit `server/src/services/analyzer.ts`:
```typescript
private readonly DEBOUNCE_MS = 300;  // Change to 100, 500, etc.
```

### Adding Custom Rules

Edit `server/data/rules.yml`:
```yaml
rules:
  - id: my-custom-rule
    name: My Custom Vulnerability
    severity: high
    sinks:
      - dangerous_function
    sources:
      - user_input
```

No code changes required - server reloads rules on restart.

## Packaging Extension (Future)

```bash
cd client
npm run package
```

This creates `.vsix` file for distribution.

## Next Steps

1. **Test with real code**: Open your own Python projects
2. **Tune rules**: Adjust `rules.yml` for your codebase
3. **Report issues**: Note false positives/negatives
4. **Extend**: Add new vulnerability types to `rules.yml`

## Architecture Overview

```
User types → LSP Client → LSP Server → Tree-sitter → Taint Analyzer → Diagnostics
   (VS Code)              (Node.js)     (Parse)      (Detect)        (Display)
```

See `architecture.md` for detailed design rationale.
