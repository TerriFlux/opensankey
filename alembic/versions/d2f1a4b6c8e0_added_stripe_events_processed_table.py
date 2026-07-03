"""Added stripe_events_processed table (webhook idempotency)

Revision ID: d2f1a4b6c8e0
Revises: 90a4654501ae
Create Date: 2026-07-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd2f1a4b6c8e0'
down_revision = '90a4654501ae'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'stripe_events_processed',
        sa.Column('event_id', sa.String(length=255), nullable=False),
        sa.Column('event_type', sa.String(length=128), nullable=True),
        sa.Column('processed_at', sa.String(length=128), nullable=True),
        sa.PrimaryKeyConstraint('event_id'),
    )


def downgrade() -> None:
    op.drop_table('stripe_events_processed')
