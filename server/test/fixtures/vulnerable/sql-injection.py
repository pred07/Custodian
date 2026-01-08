from flask import request
import sqlite3

def get_user(user_id):
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    # QUERY_VULNERABILITY: sql-injection
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
