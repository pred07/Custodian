# Troubleshooting - Extension Not Showing Diagnostics

## What I See in Your Screenshot

✅ Extension Development Host is running  
✅ Python file created (`test.py`)  
✅ Vulnerable code is present (line 8: `cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")`)  
❌ No red squiggles visible yet

## Possible Issues

### Issue 1: Server Not Starting

The LSP server might not be starting. Let's check:

**In the Extension Development Host window:**
1. Go to: **View → Output** (or press `Ctrl+Shift+U`)
2. In the dropdown at the top right, select **"Secure Coding LSP"**
3. Look for messages like:
   ```
   Secure Coding LSP Server initializing...
   Document opened: file:///...
   ```

If you see errors, that's the problem.

### Issue 2: File Not Saved as .py

Make sure the file is saved with `.py` extension:
- Press `Ctrl+S` to save
- Verify the tab shows `test.py` (not just `test`)

### Issue 3: Extension Not Activated

The extension only activates for Python files. Check:
1. Look at the bottom right corner of VS Code
2. It should say "Python" as the language mode
3. If it says "Plain Text", click it and select "Python"

### Issue 4: Server Build Issue

The server might not be properly built. Let's rebuild:

**In the MAIN window (left side), run:**
```bash
cd server
npm run build
```

Then close and reopen the Extension Development Host.

## Quick Diagnostic Steps

### Step 1: Check Server Logs

In Extension Development Host:
- View → Output
- Select "Secure Coding LSP" from dropdown
- Screenshot what you see

### Step 2: Check Problems Panel

In Extension Development Host:
- Press `Ctrl+Shift+M` to open Problems panel
- Do you see any entries with source "secure-coding"?

### Step 3: Force Re-analysis

In Extension Development Host:
- Make a small edit (add a space, then delete it)
- Wait 500ms
- Check if squiggles appear

### Step 4: Check Extension is Loaded

In Extension Development Host:
- Press `Ctrl+Shift+X` (Extensions panel)
- Search for "Secure Coding"
- Is it shown and enabled?

## What to Send Me

Please share:
1. Screenshot of **Output panel** with "Secure Coding LSP" selected
2. Screenshot of **Problems panel** (`Ctrl+Shift+M`)
3. What language mode is shown (bottom right corner)

This will help me diagnose the exact issue!
