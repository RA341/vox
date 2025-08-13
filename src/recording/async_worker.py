import asyncio

import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

# Load model and processor
model_id = "openai/whisper-medium"
model = AutoModelForSpeechSeq2Seq.from_pretrained(model_id)
processor = AutoProcessor.from_pretrained(model_id)

# Create pipeline
pipe = pipeline(
    "automatic-speech-recognition",
    model=model,
    tokenizer=processor.tokenizer,
    feature_extractor=processor.feature_extractor,
    torch_dtype=torch.float16,
    device="cuda:0" if torch.cuda.is_available() else "cpu"
)


class AsyncQueue:
    def __init__(self, processing_function):
        self._queue = asyncio.Queue()
        self._processing_function = processing_function
        self._worker_task = None

    async def put(self, item):
        """Adds an item to the queue."""
        await self._queue.put(item)
        print(f"Added item to queue: {item}. Queue size: {self._queue.qsize()}")

    async def _worker(self):
        """The main worker loop that processes items from the queue."""
        print("Worker is running...")
        while True:
            try:
                # Wait for an item from the queue
                item = await self._queue.get()
                print(f"Worker picked up item: {item}. Processing...")

                loop = asyncio.get_running_loop()
                # Run the synchronous, CPU-bound function in a separate thread
                # to avoid blocking the asyncio event loop.
                result, error = await loop.run_in_executor(
                    None, self._processing_function, item
                )

                if error:
                    print(f"ERROR processing {item}: {error}")
                    # Here you might update a database record to show the error
                else:
                    print(f"SUCCESS processing {item}. Result: '{result[:30]}...'")
                    # Here you would save the 'result' to your database
                    # For example: Recording.update(transcription=result).where(Recording.file_path == item).execute()

                # Notify the queue that the task is done
                self._queue.task_done()

            except asyncio.CancelledError:
                print("Worker received cancellation request. Shutting down.")
                break
            except Exception as e:
                print(f"An unexpected error occurred in the worker: {e}")

    def start(self):
        """Starts the background worker task."""
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._worker())
            print("Queue worker has been started.")

    async def stop(self):
        """Stops the background worker task gracefully."""
        if self._worker_task:
            print("Stopping queue worker...")
            # Wait for the queue to be empty
            await self._queue.join()
            # Cancel the worker task
            self._worker_task.cancel()
            # Wait for the cancellation to be processed
            await self._worker_task
            self._worker_task = None
            print("Queue worker has been stopped.")

