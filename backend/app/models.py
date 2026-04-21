from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    histories = relationship("FishAnalysis", back_populates="owner")

class FishAnalysis(Base):
    __tablename__ = "fish_analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String(255)) 
    
    freshness_score = Column(Float)
    eye_score = Column(Float)
    gill_score = Column(Float)
    scale_score = Column(Float)
    
    status = Column(String(50)) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="histories")