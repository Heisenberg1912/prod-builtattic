import sys
from pathlib import Path

if len(sys.argv) < 2:
    raise SystemExit("usage: write_file.py <path>")
Path(sys.argv[1]).write_text(sys.stdin.read(), encoding="utf-8")
