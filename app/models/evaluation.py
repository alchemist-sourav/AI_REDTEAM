from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    JSON,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    __table_args__ = (
        UniqueConstraint(
            "execution_result_id",
            name="uq_evaluation_execution_result",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    execution_result_id: Mapped[int] = mapped_column(
        ForeignKey("execution_results.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    verdict: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    risk_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    matched_indicators: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )