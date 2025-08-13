import os
from enum import Enum

from peewee import CharField, DateTimeField, ForeignKeyField

from src.db import BaseModel
from src.recording.async_worker import pipe, AsyncQueue
from src.user.service import User


class StatusEnum(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Recording(BaseModel):
    user = ForeignKeyField(User, backref='recordings')
    status = CharField(
        choices=[(s.value, s.name) for s in StatusEnum],
        default=StatusEnum.QUEUED.value
    )
    recording_id = CharField(unique=True)
    date = DateTimeField()
    transcription = CharField(null=True)
    fail_reason = CharField(null=True)


recording_path = "recordings"
os.makedirs(recording_path, exist_ok=True)


def get_recording_path(recording_id: str):
    return os.path.abspath(os.path.join(recording_path, recording_id))


async def start_job(recordingItem: Recording):
    save_recording(recordingItem)
    await recording_queue.put(recordingItem)


def convert_to_audio(recording: Recording):
    try:
        path = get_recording_path(str(recording.recording_id))
        result = pipe(path)

        recording.transcription = result["text"]
        recording.status = StatusEnum.COMPLETED.value
    except Exception as e:
        recording.fail_reason = str(e)
        recording.status = StatusEnum.FAILED.value


recording_queue = AsyncQueue(processing_function=convert_to_audio)


def get_all(user: User):
    try:
        query = Recording.select().where(Recording.user == user).order_by(Recording.date.desc())
        return list(query), None
    except Exception as e:
        return None, str(e)


def save_recording(record: Recording):
    try:
        record.save()
        return None
    except Exception as e:
        return str(e)
