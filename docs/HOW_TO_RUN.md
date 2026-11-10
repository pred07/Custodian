# How to Run the Extension - Step by Step

## ⚠️ Common Mistake

**DON'T** open just the `client` folder in VS Code.  
**DO** open the entire `secure code` folder.

## ✅ Correct Steps

### 1. Verify Your Workspace

Make sure VS Code shows this in the Explorer:
```
SECURE CODE (root)
├── .vscode/
├── client/
├── server/
├── test-fixtures/
├── README.md
└── ...
```

If you only see `client/` files, you're in the wrong folder!

**Fix**: File → Open Folder → Select `c:\Users\groot\Music\secure code`

### 2. Open Run and Debug

**Option A**: Press `Ctrl+Shift+D`  
**Option B**: Click the Run icon (▶🐛) in the left sidebar

### 3. Select Configuration

At the top of the Run panel, click the dropdown and select:
```
Launch Extension  ← Select this
```

NOT "Python File" or anything else!

### 4. Launch

Click the green ▶ button OR press `F5`

### 5. What Should Happen

A **NEW** VS Code window opens with title:
```
[Extension Development Host] - Visual Studio Code
```

### 6. Test in the New Window

In the Extension Development Host window:

1. Create a new file: `test.py`
2. Type this code:
```python
from flask import request
import sqlite3

def handler():
    user_id = request.args.get('id')
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

3. Wait 300ms after typing the last line
4. You should see a red squiggle under `cursor.execute`

### 7. View Diagnostics

- **Hover** over the red squiggle to see the message
- **Problems Panel**: View → Problems (Ctrl+Shift+M)

## 🐛 If You See Errors

### Error: "Cannot find module"

**Cause**: Server not built  
**Fix**:
```bash
cd server
npm run build
```

### Error: "Extension host terminated unexpectedly"

**Cause**: Client not built  
**Fix**:
```bash
cd client
npm run build
```

### Error: "No such file or directory: server.js"

**Cause**: Wrong working directory  
**Fix**: Make sure you opened `secure code` folder, not `client` folder

### No Diagnostics Appearing

**Check 1**: Is the file saved as `.py`?  
**Check 2**: Did you wait 300ms after typing?  
**Check 3**: Check Output panel → "Secure Coding LSP"

## 🔍 Debugging

### View Server Logs

In the Extension Development Host window:
1. View → Output
2. Select "Secure Coding LSP" from dropdown
3. Look for:
```
Secure Coding LSP Server initializing...
Document opened: file:///...
Analyzing: file:///...
Analysis complete: X findings in Yms
```

### Check if Extension Loaded

In the Extension Development Host window:
1. View → Extensions
2. Search for "Secure Coding"
3. Should show as enabled

## 🎯 Quick Test

Instead of F5, you can test the engine directly:

```bash
cd server
node simple-test.js
```

Expected output:
```
Loaded 4 vulnerability rules
RESULTS:
Found 1 vulnerabilities
- sql-injection : SQL Injection: Untrusted input from 'query' (confidence: high)
```

If this works but F5 doesn't, it's a VS Code configuration issue, not an engine issue.

## 📸 What You Should See

### Main Window (Before F5)
```
Run and Debug Panel
┌─────────────────────────────┐
│ Launch Extension      ▼  ▶  │  ← Click this play button
└─────────────────────────────┘
```

### New Window (After F5)
```
Title: [Extension Development Host]
File: test.py

1  from flask import request
2  import sqlite3
3  
4  def handler():
5      user_id = request.args.get('id')
6      cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                      ⚠️ SQL Injection: Untrusted input from 'user_id'
```

## Still Having Issues?

Tell me:
1. What exact error message you see
2. What's in Output → "Secure Coding LSP"
3. Screenshot of your VS Code workspace (Explorer panel)
