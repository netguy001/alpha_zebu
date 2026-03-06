"""Add firebase_uid and auth_provider columns, make password_hash nullable

Revision ID: 001_firebase_auth
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "001_firebase_auth"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add firebase_uid column (unique, indexed, nullable for existing users)
    op.add_column("users", sa.Column("firebase_uid", sa.String(128), nullable=True))
    op.create_index("ix_users_firebase_uid", "users", ["firebase_uid"], unique=True)

    # Add auth_provider column with default 'firebase'
    op.add_column(
        "users",
        sa.Column(
            "auth_provider",
            sa.String(30),
            nullable=False,
            server_default=sa.text("'firebase'"),
        ),
    )

    # Make password_hash nullable (Firebase users have no password)
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(255),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.String(255),
        nullable=False,
    )
    op.drop_column("users", "auth_provider")
    op.drop_index("ix_users_firebase_uid", table_name="users")
    op.drop_column("users", "firebase_uid")
