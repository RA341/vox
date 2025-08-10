import os
import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse

from src.api import api_routes

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
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=UI_DIR), name="static")
app.include_router(api_routes, prefix="/api", tags=["api"])

@app.get("/",description="serves the main index.html")
async def root():
    return FileResponse(os.path.join(UI_DIR, "index.html"))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
