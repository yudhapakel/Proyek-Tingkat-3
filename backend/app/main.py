from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from . import models
from .ai_engine.vision import analyze_fish_image
from .database import SessionLocal, engine, get_db
from .schemas import ArticleListResponse, ArticleResponse, AnalysisResponse, TokenResponse, UserCreate, UserLogin, UserResponse
from .security import create_access_token, get_current_user, hash_password, verify_password

models.Base.metadata.create_all(bind=engine)


def _ensure_analysis_schema() -> None:
    """Small dev migration for old local DBs created before Phase 1 cleanup."""
    inspector = inspect(engine)
    if "fish_analysis_history" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("fish_analysis_history")}
    columns_to_add = {
        "filename": "VARCHAR(255)",
        "fish_type": "VARCHAR(100)",
        "overall_score": "FLOAT DEFAULT 0",
        "confidence_score": "FLOAT DEFAULT 0",
        "model_used": "VARCHAR(100) DEFAULT 'heuristic_fallback'",
        "recommendation": "TEXT",
    }

    with engine.begin() as connection:
        for column_name, column_type in columns_to_add.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE fish_analysis_history ADD COLUMN {column_name} {column_type}"))


_ensure_analysis_schema()


SEED_ARTICLES = [
    {
        "slug": "menjaga-kualitas-ikan-segar-distribusi",
        "title": "Cara Menjaga Kualitas Ikan Segar Selama Distribusi",
        "summary": "Panduan praktis menjaga rantai dingin, kebersihan wadah, dan waktu distribusi agar kualitas ikan tetap stabil.",
        "content": "Kualitas ikan sangat dipengaruhi oleh suhu, kebersihan, dan waktu penanganan setelah ditangkap. Distributor perlu menjaga rantai dingin dengan es atau cold storage, memisahkan ikan rusak dari ikan segar, serta menghindari paparan sinar matahari langsung. Pemeriksaan visual seperti kejernihan mata, warna insang, bau, dan tekstur sisik juga penting dilakukan sebelum ikan dipasarkan.",
        "category": "Edukasi",
        "tags": "kualitas ikan,distribusi,rantai dingin",
        "image_url": "https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?auto=format&fit=crop&w=900&q=80",
        "source_url": "https://www.fao.org/fishery/en/topic/166973",
    },
    {
        "slug": "indikator-ikan-segar-untuk-qc",
        "title": "Indikator Visual Ikan Segar untuk Petugas QC",
        "summary": "Kenali tanda dasar ikan segar dari mata, insang, bau, tekstur, dan kondisi sisik sebelum masuk proses penjualan.",
        "content": "Ikan segar umumnya memiliki mata jernih dan menonjol, insang berwarna merah cerah, bau laut yang tidak menyengat, tekstur daging elastis, serta sisik yang masih melekat kuat. Jika mata keruh, insang kecokelatan, lendir berlebih, atau bau asam muncul, ikan perlu diperiksa lebih lanjut sebelum didistribusikan.",
        "category": "Quality Control",
        "tags": "qc,ikan segar,insang,sisik",
        "image_url": "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=900&q=80",
        "source_url": "https://www.fao.org/4/v7180e/V7180E05.htm",
    },
    {
        "slug": "peran-ai-dalam-sortasi-kualitas-ikan",
        "title": "Peran AI dalam Sortasi Kualitas Ikan",
        "summary": "AI dapat membantu distributor mempercepat pemeriksaan awal kualitas ikan melalui analisis gambar dan riwayat pemeriksaan.",
        "content": "Sistem berbasis AI dapat digunakan sebagai alat bantu sortasi awal dengan membaca pola visual pada gambar ikan. Model dapat dilatih untuk mengenali indikator seperti warna, kecerahan, tekstur, dan pola kerusakan. Hasil AI tetap perlu diposisikan sebagai rekomendasi pendukung, bukan pengganti sepenuhnya dari pemeriksaan manual petugas QC.",
        "category": "Teknologi",
        "tags": "ai,computer vision,sortasi ikan",
        "image_url": "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=900&q=80",
        "source_url": "https://www.fao.org/fishery/en/openasfa",
    },
]


def _seed_articles() -> None:
    db = SessionLocal()
    try:
        if db.query(models.Article).first():
            return
        db.add_all(models.Article(**article) for article in SEED_ARTICLES)
        db.commit()
    finally:
        db.close()


_seed_articles()

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Fisight API",
    description="Sistem Identifikasi Kualitas Ikan untuk Distributor Perikanan",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def read_root():
    return {"message": "Server Backend Fisight nyala bro!", "service": "fisight-api"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "success", "message": "Koneksi FastAPI ke MySQL Docker sukses dan aman!"}


@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = models.User(
        name=payload.name.strip(),
        email=email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id), extra={"email": user.email})
    return TokenResponse(access_token=token, user=user)


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah")

    token = create_access_token(subject=str(user.id), extra={"email": user.email})
    return TokenResponse(access_token=token, user=user)


@app.post("/auth/token", response_model=TokenResponse)
def swagger_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Swagger Authorize mengirim field bernama username, jadi kita pakai sebagai email.
    email = form_data.username.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah")

    token = create_access_token(subject=str(user.id), extra={"email": user.email})
    return TokenResponse(access_token=token, user=user)


@app.get("/users/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.get("/articles", response_model=list[ArticleListResponse])
def list_articles(
    category: str | None = None,
    search: str | None = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(models.Article).filter(models.Article.is_published.is_(True))
    if category:
        query = query.filter(models.Article.category == category)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            models.Article.title.ilike(pattern)
            | models.Article.summary.ilike(pattern)
            | models.Article.content.ilike(pattern)
        )

    safe_limit = max(1, min(limit, 50))
    return query.order_by(models.Article.published_at.desc()).limit(safe_limit).all()


@app.get("/articles/{slug}", response_model=ArticleResponse)
def get_article_detail(slug: str, db: Session = Depends(get_db)):
    article = (
        db.query(models.Article)
        .filter(models.Article.slug == slug, models.Article.is_published.is_(True))
        .first()
    )
    if not article:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    return article


def _validate_image(file: UploadFile) -> None:
    allowed_content_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail="Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.",
        )


@app.post("/scan", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def scan_ikan(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _validate_image(file)
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="File gambar kosong")

    safe_suffix = Path(file.filename or "fish.jpg").suffix.lower() or ".jpg"
    saved_filename = f"{uuid4().hex}{safe_suffix}"
    saved_path = UPLOAD_DIR / saved_filename
    saved_path.write_bytes(image_bytes)

    result = analyze_fish_image(image_bytes)

    analysis = models.FishAnalysis(
        user_id=current_user.id,
        filename=file.filename,
        image_url=f"/uploads/{saved_filename}",
        fish_type=result.get("fish_type", "Tidak diketahui"),
        overall_score=float(result.get("overall_score", 0)),
        freshness_score=float(result.get("freshness_score", 0)),
        eye_score=float(result.get("eye_score", 0)),
        gill_score=float(result.get("gill_score", 0)),
        scale_score=float(result.get("scale_score", 0)),
        confidence_score=float(result.get("confidence_score", result.get("confidence", 0))),
        model_used=result.get("model_used", "heuristic_fallback"),
        status=result.get("status", "Tidak diketahui"),
        recommendation=result.get("recommendation"),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis


@app.get("/analysis/history", response_model=list[AnalysisResponse])
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.FishAnalysis)
        .filter(models.FishAnalysis.user_id == current_user.id)
        .order_by(models.FishAnalysis.created_at.desc())
        .all()
    )


@app.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_detail(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    analysis = (
        db.query(models.FishAnalysis)
        .filter(
            models.FishAnalysis.id == analysis_id,
            models.FishAnalysis.user_id == current_user.id,
        )
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Riwayat analisis tidak ditemukan")
    return analysis


@app.delete("/analysis/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    analysis = (
        db.query(models.FishAnalysis)
        .filter(
            models.FishAnalysis.id == analysis_id,
            models.FishAnalysis.user_id == current_user.id,
        )
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Riwayat analisis tidak ditemukan")

    db.delete(analysis)
    db.commit()
    return None
