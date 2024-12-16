import whisper
import tempfile
import os
from pydub import AudioSegment


def convert_audio_to_wav(input_path, output_path):
    """Convert audio file to WAV format"""
    audio = AudioSegment.from_file(input_path)
    audio.export(output_path, format="wav")


def transcribe_audio(file_path):
    """Transcribe audio file using Whisper"""
    # Load Whisper model (downloads automatically first time)
    model = whisper.load_model("base")

    # Transcribe
    result = model.transcribe(file_path)

    return result["text"]
