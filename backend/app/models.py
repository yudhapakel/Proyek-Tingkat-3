from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    histories = relationship("FishAnalysis", back_populates="owner", cascade="all, delete-orphan")


class FishAnalysis(Base):
    __tablename__ = "fish_analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=True)
    image_url = Column(String(255), nullable=True)

    fish_type = Column(String(100), nullable=True)
    overall_score = Column(Float, nullable=False, default=0)
    freshness_score = Column(Float, nullable=False, default=0)
    eye_score = Column(Float, nullable=False, default=0)
    gill_score = Column(Float, nullable=False, default=0)
    scale_score = Column(Float, nullable=False, default=0)
    confidence_score = Column(Float, nullable=False, default=0)
    model_used = Column(String(100), nullable=False, default="heuristic_fallback")

    status = Column(String(50), nullable=False)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="histories")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(160), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, default="Edukasi")
    tags = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    source_url = Column(String(500), nullable=True)
    author = Column(String(100), nullable=False, default="Fisight Team")
    is_published = Column(Boolean, nullable=False, default=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
