import sys
import os
import whisper
from pydub import AudioSegment


def convert_audio_to_wav(input_path, output_path):
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    audio = AudioSegment.from_file(input_path)
    audio.export(output_path, format="wav")


def transcribe_audio(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"WAV file not found: {file_path}")

    model = whisper.load_model("base")
    result = model.transcribe(file_path)
    return result["text"]


if __name__ == "__main__":
    try:
        if len(sys.argv) != 3:
            raise ValueError(
                "Usage: python whisper_transcribe.py <input_path> <output_path>")

        input_path = os.path.abspath(sys.argv[1])
        output_path = os.path.abspath(sys.argv[2])

        convert_audio_to_wav(input_path, output_path)
        text = transcribe_audio(output_path)
        print(text, flush=True)

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr, flush=True)
        sys.exit(1)
