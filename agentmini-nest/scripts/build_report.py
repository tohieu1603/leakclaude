"""Entry point: render diagrams, then build both Vietnamese and English reports.

Run:
    python3 scripts/build_report.py
Output:
    docs/figures/*.png
    docs/project-report-vi.docx
    docs/project-report-en.docx
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import diagrams
import content_vi
import content_en
from report_builder import build


def main() -> None:
    diagrams.render_all()
    out_dir = ROOT / "docs"
    vi_out = build(content_vi.get_report(), out_dir / "project-report-vi.docx")
    en_out = build(content_en.get_report(), out_dir / "project-report-en.docx")
    print(f"Wrote {vi_out}")
    print(f"Wrote {en_out}")


if __name__ == "__main__":
    main()
