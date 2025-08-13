import os
from contextlib import asynccontextmanager

import uvicorn

from fastapi import FastAPI, Request, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from src.db import db
from src.recording.handler import recording_router
from src.recording.service import Recording, recording_queue
from src.user.handler import authCookieName, authHandler
from src.user.service import User, verify_cookie

originsEnv = os.getenv("origins")

origins = ["http://localhost:5174"]
if originsEnv:
    origins.extend(originsEnv.split(","))

print("origins", origins)

UI_DIR = "ui"

UI_EXISTS = os.path.exists(UI_DIR) and os.path.isdir(UI_DIR)
if not UI_EXISTS:
    print(f"UI files not found in {UI_DIR}")
    exit(1)

app = FastAPI(
    title="Vox",
    description="",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    if not request.url.path.startswith("/api/"):
        return await call_next(request)

    # skip auth check for auth endpoints
    if request.url.path.startswith("/api/auth"):
        return await call_next(request)

    auth_cookie = request.cookies.get(authCookieName)
    if not auth_cookie:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Missing or invalid auth token"},
        )

    user = verify_cookie(auth_cookie)
    if not user:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Missing or invalid auth token"},
        )

    request.state.user = user
    return await call_next(request)


app.mount("/", StaticFiles(directory=UI_DIR, html=True), name="ui")

api_routes = APIRouter()
api_routes.include_router(authHandler, prefix="/auth", tags=["auth"])
api_routes.include_router(recording_router, prefix="/recording", tags=["recording"])


class PingResponse(BaseModel):
    message: str


@api_routes.get(
    "/ping",
    description="pings the api, requires authentication useful to check if you have a valid cookie",
    response_model=PingResponse
)
async def ping():
    return {"message": "pong"}


app.include_router(api_routes, prefix="/api", tags=["api"])


@asynccontextmanager
async def lifespan(app2: FastAPI):
    print("Starting recording queue")
    recording_queue.start()
    print("Started recording queue")

    # On application shutdown
    print("Application shutting down...")
    await recording_queue.stop()


if __name__ == "__main__":
    # On application startup
    print("Application starting up...")
    db.connect()
    db.create_tables([User, Recording], safe=True)
    print("Database connected and tables ensured.")

    uvicorn.run(app, host="0.0.0.0", port=8000)
