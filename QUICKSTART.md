# Quick Start Guide

## ✅ Installation Complete

Both server and client are now built and ready to test.

## 🚀 How to Run

### Method 1: Press F5 (Recommended)

1. **In VS Code**: Press `F5` or click Run → Start Debugging
2. **A new VS Code window will open** (Extension Development Host)
3. **In the new window**: Open any Python file from `test-fixtures/`
4. **Watch for diagnostics** (red squiggles) to appear

### Method 2: Manual Testing

If F5 doesn't work, try this:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: "Developer: Reload Window"
3. Then press `F5`

## 🧪 Testing the System

### Test 1: SQL Injection Detection

1. Open `test-fixtures/sql_injection.py`
2. **Expected**: Red squiggles under these lines:
   - Line 15: `cursor.execute(query)` in `get_user_vulnerable`
   - Line 25: `cursor.execute("SELECT * FROM products...")` in `search_vulnerable`
3. **No errors** on:
   - Line 34: Parameterized query (safe)
   - Line 43: String literal (safe)

### Test 2: Live Detection (Keystroke-Time)

1. Create a new file: `test.py`
2. Type this code **slowly**:
   ```python
   from flask import request
   import sqlite3
   
   def handler():
       user_id = request.args.get('id')
       conn = sqlite3.connect('db.sqlite')
       cursor = conn.cursor()
       cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
   ```
3. **Expected**: After typing the `cursor.execute` line, wait 300ms
4. **Result**: Red squiggle appears under `cursor.execute`

### Test 3: Incomplete Syntax Handling

1. Open `test-fixtures/incomplete_syntax.py`
2. **Expected**: Diagnostics appear even though syntax is broken
3. This proves Tree-sitter's error recovery works

### Test 4: Command Injection

1. Open `test-fixtures/command_injection.py`
2. **Expected**: Errors on:
   - `os.system(f"ping...")`
   - `subprocess.run(..., shell=True)`
   - `eval(expression)`

### Test 5: Path Traversal

1. Open `test-fixtures/path_traversal.py`
2. **Expected**: Errors on:
   - `open(f"/var/www/uploads/{filename}")`
   - `open(path)` with user input

## 🔍 Viewing Diagnostics

### Hover Over Squiggles
- Hover your mouse over red squiggles
- **Message format**: `SQL Injection: Untrusted input from 'user_id'`

### Problems Panel
- View → Problems (`Ctrl+Shift+M`)
- Shows all detected vulnerabilities
- Source: `secure-coding`

### LSP Server Logs
- View → Output
- Select "Secure Coding LSP" from dropdown
- See analysis timing and debug info

## ⚙️ Configuration

### Adjust Debounce Delay

If 300ms feels too slow/fast:

1. Edit `server/src/services/analyzer.ts`
2. Change: `private readonly DEBOUNCE_MS = 300;`
3. Rebuild: `cd server && npm run build`
4. Reload VS Code window

### Add Custom Rules

1. Edit `server/data/rules.yml`
2. Add new vulnerability definitions
3. Rebuild server
4. Reload VS Code

## 🐛 Troubleshooting

### No diagnostics appearing?

**Check 1**: Is the file a `.py` file?
- Extension only activates for Python

**Check 2**: View LSP server output
- Output panel → "Secure Coding LSP"
- Look for errors

**Check 3**: Rebuild everything
```bash
cd server && npm run build
cd ../client && npm run build
```

### "Language server failed to start"?

**Solution**: Check that `server/dist/server.js` exists
```bash
ls server/dist/server.js
```

If missing, run: `cd server && npm run build`

### Extension not loading?

**Solution**: Check `client/dist/extension.js` exists
```bash
ls client/dist/extension.js
```

If missing, run: `cd client && npm run build`

## 📊 Performance Expectations

- **Parse time**: <10ms
- **Analysis time**: <100ms
- **Debounce delay**: 300ms
- **Total latency**: ~400ms from last keystroke

## 🎯 What to Look For

### ✅ Good Signs
- Diagnostics appear within 500ms of stopping typing
- Incomplete code still gets analyzed
- Safe code (parameterized queries) has no errors
- Confidence levels are reasonable

### ⚠️ Issues to Report
- False positives (safe code flagged as vulnerable)
- False negatives (vulnerable code not detected)
- Crashes or errors in Output panel
- Slow performance (>1 second delays)

## 🔄 Development Workflow

### Making Changes

**Server changes**:
```bash
cd server
npm run watch  # Auto-recompile on save
```

**Client changes**:
```bash
cd client
npm run watch  # Auto-recompile on save
```

Then reload the Extension Development Host window (`Ctrl+R` in the test window).

### Adding New Vulnerability Types

1. Edit `server/data/rules.yml`
2. Add rule definition (see existing examples)
3. Rebuild: `cd server && npm run build`
4. Test with new fixture file

## 📝 Next Steps

1. **Test all fixtures** to verify detection works
2. **Try with your own code** to find false positives
3. **Review architecture.md** to understand design decisions
4. **Tune rules.yml** for your specific needs
5. **Report findings** - what works, what doesn't

## 🎓 Understanding the System

```
User types → 300ms debounce → Parse (Tree-sitter) → Find sinks → 
Trace taint → Classify confidence → Publish diagnostics → Display
```

- **Sink-first**: Only analyzes when dangerous functions are present
- **Intra-procedural**: Traces within current function only
- **Confidence-based**: High/medium/low labels on findings

See `architecture.md` for detailed rationale.
