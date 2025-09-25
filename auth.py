import sqlite3
from datetime import datetime

DB = 'database.db'

def check_code(code):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT expires FROM codes WHERE code=?", (code,))
    result = c.fetchone()
    conn.close()
    if result:
        expires = datetime.strptime(result[0], "%Y-%m-%d %H:%M:%S")
        return datetime.now() < expires
    return False
