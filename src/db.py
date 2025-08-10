from peewee import SqliteDatabase

db = SqliteDatabase('vox.db')

# Setting up database and creating tables
def setup_database():
    # Connect to database
    db.connect()

    # Create tables for all models
    db.create_tables([])

    print("Database and tables created successfully!")
