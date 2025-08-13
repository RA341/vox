from fastapi import APIRouter, Response, HTTPException, status
from pydantic import BaseModel

from src.user.service import login_user, create_user

authCookieName = "auth"

authHandler = APIRouter()


# Request models for OpenAPI spec
class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    passwordVerify: str


# Response models
class AuthResponse(BaseModel):
    message: str


@authHandler.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, resp: Response):
    token, err = login_user(req.username, req.password)
    if err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=err
        )

    resp.set_cookie(
        key=authCookieName,
        value=token,
        httponly=True,  # Prevents JavaScript access (XSS protection)
        secure=False,  # Only send over HTTPS in production
        samesite="lax",  # CSRF protection
        max_age=86400  # Cookie expires in 24 hours (seconds)
    )

    return {"message": "Login successful"}


@authHandler.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    if request.password != request.passwordVerify:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="passwords do not match"
        )

    err = create_user(request.username, request.password)
    if err is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err
        )

    return {"message": "Registration successful"}
