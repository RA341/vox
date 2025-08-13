import uuid
from typing import Optional

from peewee import Model, CharField, BooleanField
import bcrypt

from src.db import BaseModel


class User(BaseModel):
    username = CharField(unique=True)
    hashed_password = CharField()
    auth_token = CharField(unique=True)


def save_user(user: User):
    try:
        user.save()
        return None
    except Exception as e:
        return str(e)


def create_user(username, password):
    try:
        hashed = hash_str(password)
        token = generate_auth_token()
        hash_token = hash_str(token)

        User.create(
            username=username,
            hashed_password=hashed,
            auth_token=hash_token,
        )
        return None
    except Exception as e:
        return str(e)


def login_user(username: str, password: str) -> (str, str):
    try:
        user, err = get_user_by_username(username)
        if err:
            return None, "Invalid username or password"

        if not verify_hash(password, user.hashed_password):
            return None, "Invalid username or password"

        token = generate_auth_token()
        user.auth_token = token

        err = save_user(user)
        if err:
            return None, err

        # Return plain token to user
        return token, None
    except Exception as e:
        return None, str(e)


def verify_cookie(cookie: str):
    return get_user_by_auth_token(cookie)


def get_user_by_username(username) -> (User, str):
    try:
        user: Optional[User] = User.get_or_none(User.username == username)
        if user is None:
            return None, "user not found"
        return user, None
    except Exception as e:
        return None, str(e)


def get_user_by_auth_token(token: str) -> (str, str):
    try:
        user = User.get_or_none(User.auth_token == token)
        return user
    except Exception as e:
        return None


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
