import sqlite3

def get_user_safe(user_id):
    conn = sqlite3.connect('db.sqlite')
    cursor = conn.cursor()
    # Safe - using parameters
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
