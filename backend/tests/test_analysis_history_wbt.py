from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.models import Base, FishAnalysis, User


def _create_test_session():
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def test_history_returns_only_current_user_analysis():
    """WBT: riwayat analisis harus difilter berdasarkan user_id user login."""
    db = _create_test_session()
    try:
        current_user = User(name="Yudha", email="yudha@example.com", hashed_password="hashed")
        other_user = User(name="Other", email="other@example.com", hashed_password="hashed")
        db.add_all([current_user, other_user])
        db.commit()
        db.refresh(current_user)
        db.refresh(other_user)

        db.add_all(
            [
                FishAnalysis(
                    user_id=current_user.id,
                    filename="gurame.jpg",
                    fish_type="Ikan Gurame",
                    overall_score=85,
                    freshness_score=80,
                    eye_score=82,
                    gill_score=84,
                    scale_score=86,
                    confidence_score=0.9,
                    model_used="heuristic_fallback",
                    status="Baik",
                    recommendation="Layak dipasarkan",
                    created_at=datetime.now(timezone.utc),
                ),
                FishAnalysis(
                    user_id=other_user.id,
                    filename="mujair.jpg",
                    fish_type="Ikan Mujair",
                    overall_score=60,
                    freshness_score=60,
                    eye_score=60,
                    gill_score=60,
                    scale_score=60,
                    confidence_score=0.7,
                    model_used="heuristic_fallback",
                    status="Sedang",
                    recommendation="Perlu penanganan cepat",
                    created_at=datetime.now(timezone.utc) + timedelta(seconds=1),
                ),
            ]
        )
        db.commit()

        histories = (
            db.query(FishAnalysis)
            .filter(FishAnalysis.user_id == current_user.id)
            .order_by(FishAnalysis.created_at.desc())
            .all()
        )

        assert len(histories) == 1
        assert histories[0].user_id == current_user.id
        assert histories[0].fish_type == "Ikan Gurame"
        assert histories[0].status == "Baik"
    finally:
        db.close()


def test_history_returns_empty_list_when_user_has_no_analysis():
    """WBT: jika user belum pernah scan, riwayat harus kosong, bukan error."""
    db = _create_test_session()
    try:
        current_user = User(name="Yudha", email="empty@example.com", hashed_password="hashed")
        db.add(current_user)
        db.commit()
        db.refresh(current_user)

        histories = (
            db.query(FishAnalysis)
            .filter(FishAnalysis.user_id == current_user.id)
            .order_by(FishAnalysis.created_at.desc())
            .all()
        )

        assert histories == []
    finally:
        db.close()
