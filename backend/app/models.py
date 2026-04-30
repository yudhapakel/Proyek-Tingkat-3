from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
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

    status = Column(String(50), nullable=False)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="histories")
