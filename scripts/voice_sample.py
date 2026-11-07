"""Record the same short passage in several Kokoro voices, so a voice can be
chosen before recording whole lessons. Writes samples/<voice>.mp3."""
import pathlib
import subprocess

import soundfile as sf
from kokoro_onnx import Kokoro

TEXT = (
    "What is a computer, really? Strip away the screen, the keyboard and the apps, "
    "and a computer is a machine that does exactly one kind of thing: it transforms "
    "information by following instructions. A photo, a song, a web page, a video game, "
    "a spreadsheet: to a computer, all of these are just information, and all of that "
    "information is stored as numbers. That's the big idea of this whole unit, so let it sink in."
)
VOICES = {
    "af_heart": "en-us",
    "af_bella": "en-us",
    "am_michael": "en-us",
    "am_puck": "en-us",
    "bf_emma": "en-gb",
    "bm_george": "en-gb",
}

out = pathlib.Path("samples")
out.mkdir(exist_ok=True)
kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
for voice, lang in VOICES.items():
    samples, rate = kokoro.create(TEXT, voice=voice, speed=1.0, lang=lang)
    wav = out / f"{voice}.wav"
    sf.write(wav, samples, rate)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-ac", "1", "-b:a", "96k", str(out / f"{voice}.mp3")], check=True)
    wav.unlink()
    print("recorded", voice)
