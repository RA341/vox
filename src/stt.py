import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

# Load model and processor
model_id = "openai/whisper-large-v3"
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

# Use the model
result = pipe("path/to/your/audio.wav")
print(result["text"])
