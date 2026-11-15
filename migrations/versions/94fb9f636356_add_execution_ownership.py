
"""add execution ownership

Revision ID: 94fb9f636356
Revises: f0bf80bbc016
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "94fb9f636356"
down_revision: Union[str, Sequence[str], None] = "f0bf80bbc016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the column as nullable initially.
    op.add_column(
        "execution_results",
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
    )

    # 2. Assign legacy execution records to the existing admin (ID 1).
    op.execute(
        """
        UPDATE execution_results
        SET created_by_user_id = 1
        WHERE created_by_user_id IS NULL
        """
    )

    # 3. Add the foreign key.
    op.create_foreign_key(
        "fk_execution_results_created_by_user_id_users",
        "execution_results",
        "users",
        ["created_by_user_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    # 4. Add an index for ownership queries.
    op.create_index(
        "ix_execution_results_created_by_user_id",
        "execution_results",
        ["created_by_user_id"],
        unique=False,
    )

    # 5. Enforce ownership for all future records.
    op.alter_column(
        "execution_results",
        "created_by_user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_execution_results_created_by_user_id",
        table_name="execution_results",
    )

    op.drop_constraint(
        "fk_execution_results_created_by_user_id_users",
        "execution_results",
        type_="foreignkey",
    )

    op.drop_column("execution_results", "created_by_user_id")
