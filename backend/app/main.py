from fastapi import FastAPI, Depends, File, UploadFile
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db
from .ai_engine.vision import analyze_fish_image

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fisight API", 
    description="Sistem Identifikasi Kualitas Ikan untuk Distributor"
)

@app.get("/")
def read_root():
    return {"message": "Server Backend Fisight nyala bro!"}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    return {"status": "success", "message": "Koneksi FastAPI ke MySQL Docker sukses dan aman!"}

@app.post("/scan")
async def scan_ikan(file: UploadFile = File(...)):
    # 1. Baca gambar yang diupload user
    image_bytes = await file.read()
    
    # 2. Lempar gambarnya ke AI Engine
    hasil_analisis = analyze_fish_image(image_bytes)
    
    # 3. Balikin hasilnya ke user
    return {
        "filename": file.filename, 
        "hasil_ai": hasil_analisis
    }