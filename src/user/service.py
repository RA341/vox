import uuid
from typing import Optional

from peewee import Model, CharField, BooleanField
import bcrypt

from src import db


class User(Model):
    username = CharField(unique=True)
    hashed_password = CharField(unique=True)
    hashed_auth_token = CharField(unique=True)

    class Meta:
        database = db


def create_user(username, password) -> (str, str):
    try:
        hashed = hash_str(password)
        token = generate_auth_token()
        hash_token = hash_str(token)

        User.create(
            username=username,
            hashed_password=hashed,
            hashed_auth_token=hash_token,
        )

        return token, None
    except Exception as e:
        return None, str(e)


def login_user(username: str, password: str) -> (str, str):
    try:
        user = get_user_by_username(username)  # Returns user with stored hash
        if not user:
            return None, "Invalid username or password"

        # Verify password against stored hash
        if not verify_hash(password, user.password_hash):
            return None, "Invalid username or password"

        # Generate and store token
        token = generate_auth_token()
        hash_token = hash_str(token)

        # Store hashed token in database for this user
        verify_hash(user.id, hash_token)

        # Return plain token to user
        return token, None

    except Exception as e:
        return None, str(e)


def get_user_by_username(username) -> (User, str):
    try:
        user: Optional[User] = User.get_or_none(User.username == username)
        if user is None:
            return None, "user not found"
        return user, ""
    except Exception as e:
        return None, str(e)


def get_user_by_auth_token(token: str) -> (str, str):
    try:
        user = User.get_or_none(User.hashed_auth_token == token)
        return token, ""
    except Exception as e:
        return "", str(e)


def delete_user(user_id):
    try:
        user = User.get_by_id(user_id)
        user.delete_instance()
        return "success"
    except Exception as e:
        return str(e)


# Hashing a password
def hash_str(password: str) -> str:
    # Convert password to bytes
    password_bytes = password.encode('utf-8')

    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)

    # Return the hashed password as a string
    return hashed.decode('utf-8')


def verify_hash(password: str, hashed: str) -> bool:
    # Convert both to bytes
    password_bytes = password.encode('utf-8')
    hashed_bytes = hashed.encode('utf-8')

    # Check if password matches the hash
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def generate_auth_token() -> str:
    return str(uuid.uuid4())
