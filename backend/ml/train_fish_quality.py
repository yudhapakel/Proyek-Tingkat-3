"""Train Fisight fish-quality classifier.

Expected dataset structure follows torchvision ImageFolder format.
For the current Fisight MVP, two classes are enough:

backend/datasets/fish_quality/
  baik/
    *.jpg|*.jpeg|*.png|*.webp
  buruk/
    *.jpg|*.jpeg|*.png|*.webp

A third `sedang/` class can be added later when the team has labeled borderline-quality images.

Example:
  python backend/ml/train_fish_quality.py \
    --data-dir backend/datasets/fish_quality \
    --output backend/models/fish_quality_mobilenetv2.pt \
    --epochs 8 \
    --batch-size 16
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

try:
    import torch
    from torch import nn
    from torch.utils.data import DataLoader, Subset
    from torchvision import datasets, models, transforms
except ModuleNotFoundError as exc:  # pragma: no cover - dependency guard for local setup
    raise SystemExit(
        "Dependency AI belum terpasang. Jalankan dulu:\n"
        "  .venv/bin/python -m pip install -r backend/requirements-ai.txt"
    ) from exc

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class NonEmptyImageFolder(datasets.ImageFolder):
    """ImageFolder variant that ignores class folders without valid images.

    The repo keeps `sedang/.gitkeep` for future 3-class training, but the current
    fresh/non-fresh dataset only fills `baik/` and `buruk/`. Plain ImageFolder
    treats empty `sedang/` as an error, so this class discovers only non-empty
    folders.
    """

    def find_classes(self, directory: str):
        root = Path(directory)
        classes = []
        for class_dir in sorted(path for path in root.iterdir() if path.is_dir()):
            has_images = any(
                file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS
                for file in class_dir.rglob("*")
            )
            if has_images:
                classes.append(class_dir.name)

        if not classes:
            raise FileNotFoundError(f"Tidak ada folder kelas berisi gambar valid di {directory}")

        return classes, {class_name: index for index, class_name in enumerate(classes)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train fish quality classifier for Fisight")
    parser.add_argument("--data-dir", type=Path, default=Path("backend/datasets/fish_quality"))
    parser.add_argument("--output", type=Path, default=Path("backend/models/fish_quality_mobilenetv2.pt"))
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--val-ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--freeze-backbone", action="store_true", help="Train classifier head only")
    return parser.parse_args()


def count_images(data_dir: Path) -> dict[str, int]:
    counts: dict[str, int] = {}
    for class_dir in sorted(path for path in data_dir.iterdir() if path.is_dir()):
        counts[class_dir.name] = sum(1 for file in class_dir.rglob("*") if file.suffix.lower() in IMAGE_EXTENSIONS)
    return counts


def validate_dataset(data_dir: Path) -> None:
    if not data_dir.exists():
        raise SystemExit(f"Dataset folder not found: {data_dir}")

    counts = {label: count for label, count in count_images(data_dir).items() if count > 0}
    if len(counts) < 2:
        raise SystemExit(
            "Dataset belum siap. Minimal butuh 2 folder kelas berisi gambar. "
            "Untuk MVP Fisight gunakan folder `baik/` dan `buruk/`."
        )

    if "baik" not in counts or "buruk" not in counts:
        print(
            "WARNING: label yang direkomendasikan untuk backend adalah `baik` dan `buruk`. "
            f"Label saat ini: {', '.join(counts)}"
        )

    small_classes = [label for label, count in counts.items() if count < 20]
    if small_classes:
        print(
            "WARNING: beberapa kelas punya <20 gambar dan rawan overfit: "
            + ", ".join(f"{label}={counts[label]}" for label in small_classes)
        )

    if sum(counts.values()) < 40:
        print("WARNING: dataset total masih kecil. Gunakan hasil training sebagai proof-of-concept dulu.")


def build_model(num_classes: int, freeze_backbone: bool) -> nn.Module:
    weights = models.MobileNet_V2_Weights.DEFAULT
    model = models.mobilenet_v2(weights=weights)
    if freeze_backbone:
        for parameter in model.features.parameters():
            parameter.requires_grad = False

    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model


def main() -> None:
    args = parse_args()
    random.seed(args.seed)
    torch.manual_seed(args.seed)

    validate_dataset(args.data_dir)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    train_transform = transforms.Compose(
        [
            transforms.Resize((256, 256)),
            transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.18, contrast=0.18, saturation=0.12),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    eval_transform = transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    train_base_dataset = NonEmptyImageFolder(args.data_dir, transform=train_transform)
    eval_base_dataset = NonEmptyImageFolder(args.data_dir, transform=eval_transform)
    class_names = train_base_dataset.classes
    print(f"Classes: {class_names}")

    val_size = max(1, int(len(train_base_dataset) * args.val_ratio))
    train_size = len(train_base_dataset) - val_size
    indices = torch.randperm(len(train_base_dataset), generator=torch.Generator().manual_seed(args.seed)).tolist()
    train_indices = indices[:train_size]
    val_indices = indices[train_size:]

    train_dataset = Subset(train_base_dataset, train_indices)
    val_dataset = Subset(eval_base_dataset, val_indices)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=2)

    model = build_model(num_classes=len(class_names), freeze_backbone=args.freeze_backbone).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW((p for p in model.parameters() if p.requires_grad), lr=args.learning_rate)

    best_val_accuracy = 0.0
    history: list[dict[str, float]] = []

    for epoch in range(1, args.epochs + 1):
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += float(loss.item()) * images.size(0)
            train_correct += int((outputs.argmax(dim=1) == labels).sum().item())
            train_total += int(labels.size(0))

        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += float(loss.item()) * images.size(0)
                val_correct += int((outputs.argmax(dim=1) == labels).sum().item())
                val_total += int(labels.size(0))

        metrics = {
            "epoch": float(epoch),
            "train_loss": train_loss / max(1, train_total),
            "train_accuracy": train_correct / max(1, train_total),
            "val_loss": val_loss / max(1, val_total),
            "val_accuracy": val_correct / max(1, val_total),
        }
        history.append(metrics)
        print(
            f"Epoch {epoch}/{args.epochs} "
            f"train_acc={metrics['train_accuracy']:.3f} val_acc={metrics['val_accuracy']:.3f} "
            f"train_loss={metrics['train_loss']:.4f} val_loss={metrics['val_loss']:.4f}"
        )

        if metrics["val_accuracy"] >= best_val_accuracy:
            best_val_accuracy = metrics["val_accuracy"]
            args.output.parent.mkdir(parents=True, exist_ok=True)
            torch.save(
                {
                    "model_name": "mobilenet_v2",
                    "class_names": class_names,
                    "model_state_dict": model.state_dict(),
                    "best_val_accuracy": best_val_accuracy,
                    "history": history,
                },
                args.output,
            )
            print(f"Saved best model to {args.output}")

    metadata_path = args.output.with_suffix(".json")
    metadata_path.write_text(
        json.dumps(
            {
                "class_names": class_names,
                "best_val_accuracy": best_val_accuracy,
                "history": history,
                "dataset_counts": count_images(args.data_dir),
            },
            indent=2,
        )
    )
    print(f"Saved metadata to {metadata_path}")


if __name__ == "__main__":
    main()
