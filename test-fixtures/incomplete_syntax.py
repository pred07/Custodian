"""
Test fixture for incomplete/broken syntax

This tests Tree-sitter's error recovery capabilities.
"""

from flask import request
import sqlite3

# Incomplete function - missing closing parenthesis
def broken_function(user_id):
    conn = sqlite3.connect('db.sqlite'
    cursor = conn.cursor()
    
    # Even with broken syntax above, this should still be detected
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query

# Incomplete f-string
def incomplete_fstring():
    user_input = request.args.get('id')
    cursor.execute(f"SELECT * FROM users WHERE id = {user_input

# Unclosed string
def unclosed_string():
    data = request.form.get('data')
    os.system(f"echo {data}

# Missing import but still has vulnerable call
def missing_import():
    filename = request.args.get('file')
    # os is not imported, but we should still detect the pattern
    os.system(f"cat {filename}")
