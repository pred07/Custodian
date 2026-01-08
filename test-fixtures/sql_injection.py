"""
Test fixture for SQL Injection detection

This file contains intentionally vulnerable code to test the analyzer.
"""

from flask import Flask, request
import sqlite3

app = Flask(__name__)

# VULNERABLE: SQL Injection via f-string
@app.route('/user/<user_id>')
def get_user_vulnerable(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # This should trigger: SQL Injection detection
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    
    return cursor.fetchone()

# VULNERABLE: SQL Injection via string concatenation
@app.route('/search')
def search_vulnerable():
    search_term = request.args.get('q')
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # This should trigger: SQL Injection detection
    cursor.execute("SELECT * FROM products WHERE name = '" + search_term + "'")
    
    return cursor.fetchall()

# SAFE: Parameterized query
@app.route('/user_safe/<user_id>')
def get_user_safe(user_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # This should NOT trigger (parameterized)
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    
    return cursor.fetchone()

# SAFE: String literal
@app.route('/all_users')
def get_all_users():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # This should NOT trigger (no user input)
    cursor.execute("SELECT * FROM users")
    
    return cursor.fetchall()
