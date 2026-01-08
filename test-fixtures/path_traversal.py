"""
Test fixture for Path Traversal detection
"""

from flask import Flask, request
import os

app = Flask(__name__)

# VULNERABLE: Path traversal
@app.route('/download')
def download_vulnerable():
    filename = request.args.get('file')
    
    # This should trigger: Path Traversal detection
    # User could provide: ../../etc/passwd
    with open(f"/var/www/uploads/{filename}", 'r') as f:
        return f.read()

# VULNERABLE: Direct user input
@app.route('/read')
def read_vulnerable():
    path = request.form.get('path')
    
    # This should trigger: Path Traversal detection
    with open(path, 'r') as f:
        return f.read()

# SAFE: Using basename
@app.route('/download_safe')
def download_safe():
    filename = request.args.get('file')
    
    # This should NOT trigger (sanitized with basename)
    safe_filename = os.path.basename(filename)
    with open(f"/var/www/uploads/{safe_filename}", 'r') as f:
        return f.read()

# SAFE: Hardcoded path
@app.route('/config')
def get_config():
    # This should NOT trigger (no user input)
    with open('/etc/app/config.json', 'r') as f:
        return f.read()
