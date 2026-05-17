"""Train Fisight fish-species classifier.

Expected dataset structure follows torchvision ImageFolder format:

backend/datasets/fish_species/
  mujair/
  gurame/
  tongkol/

Example:
  python backend/ml/train_fish_species.py \
    --data-dir backend/datasets/fish_species \
    --output backend/models/fish_species_mobilenetv2.pt \
    --epochs 12 \
    --batch-size 16 \
    --freeze-backbone
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
except ModuleNotFoundError as exc:  # pragma: no cover
    raise SystemExit(
        "Dependency AI belum terpasang. Jalankan dulu:\n"
        "  .venv/bin/python -m pip install -r backend/requirements-ai.txt"
    ) from exc

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


class NonEmptyImageFolder(datasets.ImageFolder):
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
    parser = argparse.ArgumentParser(description="Train fish species classifier for Fisight")
    parser.add_argument("--data-dir", type=Path, default=Path("backend/datasets/fish_species"))
    parser.add_argument("--output", type=Path, default=Path("backend/models/fish_species_mobilenetv2.pt"))
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=1e-4)
    parser.add_argument("--val-ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--freeze-backbone", action="store_true")
    return parser.parse_args()


def split_indices(total: int, val_ratio: float, seed: int):
    indices = list(range(total))
    random.Random(seed).shuffle(indices)
    val_size = max(1, int(total * val_ratio))
    return indices[val_size:], indices[:val_size]


def build_model(num_classes: int, freeze_backbone: bool):
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    if freeze_backbone:
        for parameter in model.features.parameters():
            parameter.requires_grad = False
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model


def run_epoch(model, loader, criterion, optimizer, device, training: bool):
    model.train(training)
    total_loss = 0.0
    correct = 0
    total = 0
    for images, labels in loader:
        images = images.to(device)
        labels = labels.to(device)
        if training:
            optimizer.zero_grad()
        with torch.set_grad_enabled(training):
            outputs = model(images)
            loss = criterion(outputs, labels)
            if training:
                loss.backward()
                optimizer.step()
        total_loss += float(loss.item()) * images.size(0)
        correct += int((outputs.argmax(dim=1) == labels).sum().item())
        total += int(images.size(0))
    return total_loss / max(total, 1), correct / max(total, 1)


def main() -> None:
    args = parse_args()
    random.seed(args.seed)
    torch.manual_seed(args.seed)

    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(224, scale=(0.65, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(12),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    base_dataset = NonEmptyImageFolder(args.data_dir, transform=val_transform)
    train_indices, val_indices = split_indices(len(base_dataset), args.val_ratio, args.seed)

    train_dataset = NonEmptyImageFolder(args.data_dir, transform=train_transform)
    val_dataset = NonEmptyImageFolder(args.data_dir, transform=val_transform)
    train_subset = Subset(train_dataset, train_indices)
    val_subset = Subset(val_dataset, val_indices)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    print(f"Classes: {base_dataset.classes}")

    train_loader = DataLoader(train_subset, batch_size=args.batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_subset, batch_size=args.batch_size, shuffle=False, num_workers=2)

    model = build_model(len(base_dataset.classes), args.freeze_backbone).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW((p for p in model.parameters() if p.requires_grad), lr=args.learning_rate)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    best_val = 0.0
    history = []
    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer, device, True)
        val_loss, val_acc = run_epoch(model, val_loader, criterion, None, device, False)
        history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "train_accuracy": train_acc,
            "val_loss": val_loss,
            "val_accuracy": val_acc,
        })
        print(
            f"Epoch {epoch}/{args.epochs} train_acc={train_acc:.3f} val_acc={val_acc:.3f} "
            f"train_loss={train_loss:.4f} val_loss={val_loss:.4f}"
        )
        if val_acc >= best_val:
            best_val = val_acc
            torch.save({
                "class_names": base_dataset.classes,
                "model_state_dict": model.state_dict(),
                "best_val_accuracy": best_val,
            }, args.output)
            print(f"Saved best model to {args.output}")

    counts = {class_name: 0 for class_name in base_dataset.classes}
    for _, label in base_dataset.samples:
        counts[base_dataset.classes[label]] += 1
    metadata_path = args.output.with_suffix(".json")
    metadata_path.write_text(json.dumps({
        "class_names": base_dataset.classes,
        "best_val_accuracy": best_val,
        "history": history,
        "dataset_counts": counts,
    }, indent=2))
    print(f"Saved metadata to {metadata_path}")


if __name__ == "__main__":
    main()
