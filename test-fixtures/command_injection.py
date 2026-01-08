"""
Test fixture for Command Injection detection
"""

from flask import Flask, request
import os
import subprocess

app = Flask(__name__)

# VULNERABLE: Command injection via os.system
@app.route('/ping')
def ping_vulnerable():
    host = request.args.get('host')
    
    # This should trigger: Command Injection detection
    os.system(f"ping -c 4 {host}")
    
    return "Ping executed"

# VULNERABLE: Command injection via subprocess
@app.route('/backup')
def backup_vulnerable():
    filename = request.form.get('file')
    
    # This should trigger: Command Injection detection
    subprocess.run(f"tar -czf backup.tar.gz {filename}", shell=True)
    
    return "Backup created"

# VULNERABLE: eval with user input
@app.route('/calc')
def calc_vulnerable():
    expression = request.args.get('expr')
    
    # This should trigger: Command Injection detection
    result = eval(expression)
    
    return str(result)

# SAFE: Using list arguments (no shell)
@app.route('/ping_safe')
def ping_safe():
    host = request.args.get('host')
    
    # This should NOT trigger (list args, no shell)
    subprocess.run(['ping', '-c', '4', host])
    
    return "Ping executed safely"
