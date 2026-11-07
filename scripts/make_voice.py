"""Record the lesson paragraphs listed in speech.json with the Kokoro voice.

Usage: python scripts/make_voice.py <audio-dir> [unit ...]

Writes <audio-dir>/<unit>/<hash>.m4a for every paragraph that doesn't have a
recording yet (so unchanged text is never recorded twice), then rewrites
<audio-dir>/index.json, which the app reads to know what exists.
"""
import json
import pathlib
import subprocess
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

audio_dir = pathlib.Path(sys.argv[1])
only = set(sys.argv[2:])
config = json.loads(pathlib.Path("voice.json").read_text())
speech = json.loads(pathlib.Path("speech.json").read_text())

kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
done = 0
for unit, clips in speech.items():
    if only and unit not in only:
        continue
    folder = audio_dir / unit
    folder.mkdir(parents=True, exist_ok=True)
    for h, text in clips.items():
        target = folder / f"{h}.m4a"
        if target.exists():
            continue
        samples, rate = kokoro.create(text, voice=config["voice"], speed=1.0, lang=config["lang"])
        wav = folder / f"{h}.wav"
        sf.write(wav, samples, rate)
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-ac", "1", "-c:a", "aac", "-b:a", "40k", "-movflags", "+faststart", str(target)],
            check=True,
        )
        wav.unlink()
        done += 1
        if done % 100 == 0:
            print(f"{unit}: recorded {done} clips", flush=True)

# Rebuild the index from what's on disk, keeping only clips the text still uses.
index = {"voice": config["label"], "files": {}}
for unit, clips in speech.items():
    folder = audio_dir / unit
    have = {p.stem for p in folder.glob("*.m4a")} if folder.exists() else set()
    index["files"][unit] = sorted(h for h in clips if h in have)
(audio_dir / "index.json").write_text(json.dumps(index))
print(f"Recorded {done} new clips; index lists {sum(len(v) for v in index['files'].values())}.")
