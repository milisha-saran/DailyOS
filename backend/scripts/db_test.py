# test_db_connection.py
from sqlalchemy.exc import OperationalError
from app.core.db import engine

def test_db_connection():
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        print("Database connection successful.")
    except OperationalError as e:
        print("Database connection failed.")
        print(f"Error: {e}")

if __name__ == "__main__":
    test_db_connection()