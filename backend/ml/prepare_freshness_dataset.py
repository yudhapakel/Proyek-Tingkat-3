"""Prepare local fresh/non-fresh fish datasets into Fisight ImageFolder format.

This script copies Yudha's downloaded datasets from `~/Tugas Kuliah SMT6` into:

backend/datasets/fish_quality/
  baik/   -> fresh fish images
  buruk/  -> non-fresh fish images

It intentionally does not commit copied images because dataset folders are ignored by git.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

DEFAULT_SOURCE_ROOT = Path.home() / "Tugas Kuliah SMT6"
DEFAULT_OUTPUT_DIR = Path("backend/datasets/fish_quality")

DEFAULT_DATASET_PAIRS = [
    ("Datasets/Anchovy/Fresh", "baik", "anchovy_fresh"),
    ("Datasets/Anchovy/NonFresh", "buruk", "anchovy_nonfresh"),
    ("Datasets/HorseMackerel/Fresh", "baik", "horsemackerel_fresh"),
    ("Datasets/HorseMackerel/NonFresh", "buruk", "horsemackerel_nonfresh"),
    ("fresh and non-freh fish/fresh", "baik", "mixed_fresh"),
    ("fresh and non-freh fish/non-fresh", "buruk", "mixed_nonfresh"),
    ("ikan_segar_manual", "baik", "manual_fresh"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare Fisight fresh/non-fresh training dataset")
    parser.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--reset", action="store_true", help="Clean output class folders before copying")
    return parser.parse_args()


def iter_images(folder: Path):
    for path in sorted(folder.rglob("*")):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            yield path


def clean_class_folder(folder: Path) -> None:
    if not folder.exists():
        return
    for file in folder.rglob("*"):
        if file.is_file() and file.name != ".gitkeep":
            file.unlink()


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    if args.reset:
        clean_class_folder(args.output_dir / "baik")
        clean_class_folder(args.output_dir / "buruk")

    copied_counts: dict[str, int] = {"baik": 0, "buruk": 0}

    for relative_source, target_label, prefix in DEFAULT_DATASET_PAIRS:
        source_dir = args.source_root / relative_source
        if not source_dir.exists():
            print(f"SKIP missing: {source_dir}")
            continue

        target_dir = args.output_dir / target_label
        target_dir.mkdir(parents=True, exist_ok=True)
        count = 0
        for index, image_path in enumerate(iter_images(source_dir), start=1):
            target_name = f"{prefix}_{index:04d}{image_path.suffix.lower()}"
            shutil.copy2(image_path, target_dir / target_name)
            count += 1

        copied_counts[target_label] += count
        print(f"Copied {count:4d} images: {source_dir} -> {target_dir}")

    print("\nDataset ready:")
    for label in ["baik", "buruk"]:
        print(f"- {label}: {copied_counts[label]} images")

    if min(copied_counts.values()) == 0:
        raise SystemExit("Dataset belum lengkap: salah satu kelas masih 0 gambar.")


if __name__ == "__main__":
    main()
