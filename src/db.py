from peewee import SqliteDatabase, Model

db = SqliteDatabase('vox.db')

class BaseModel(Model):
    class Meta:
        database = db
