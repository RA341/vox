import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, UploadFile, File, Request, status, HTTPException
from pydantic import BaseModel

from src.recording.service import get_recording_path, Recording, get_all, start_job
from src.user.service import User

recording_router = APIRouter()


class NewRecordingResponse(BaseModel):
    message: str


class RecordingItem(BaseModel):
    status: str
    recording_id: str
    date: str
    transcription: str
    fail_reason: str


class ListRecordingResponse(BaseModel):
    recordings: List[RecordingItem]


@recording_router.get("/", response_model=ListRecordingResponse)
def list_recording(request: Request):
    user: User = request.state.user

    recs, err = get_all(user)
    if err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err
        )

    api_records = []

    for r in recs:
        item = RecordingItem(
            status=r.status,
            recording_id=r.recording_id,
            date=r.date.isoformat(),
            transcription=r.transcription or "",
            fail_reason=r.fail_reason or "",
        )
        api_records.append(item)

    return ListRecordingResponse(recordings=api_records)


@recording_router.post("/", response_model=NewRecordingResponse)
async def new_recording(
        request: Request,
        recording: UploadFile = File(...),
):
    user: User = request.state.user
    contents = await recording.read()

    recording_id = str(uuid.uuid4())

    fullpath = get_recording_path(recording_id)
    fullpath = f"{fullpath}.wav"

    with open(fullpath, "wb") as file_object:
        file_object.write(contents)

    recordingItem = Recording(
        user=user,
        recording_id=recording_id,
        date=datetime.now()
    )
    await start_job(recordingItem)

    return {
        "message": "added file successfully",
    }


def delete_recording():
    pass


def edit_recording():
    pass
