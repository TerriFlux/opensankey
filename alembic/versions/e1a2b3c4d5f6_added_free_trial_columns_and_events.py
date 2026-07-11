"""Added free-trial columns on user + trial_events table + utm_campaign

Revision ID: e1a2b3c4d5f6
Revises: d2f1a4b6c8e0
Create Date: 2026-07-10 00:00:00.000000

Essai gratuit 30 jours géré en base (jamais dans Stripe) : colonnes d'état
d'essai et d'attribution UTM sur `user`, plus une table `trial_events` pour la
mesure de conversion (started / converted / expired).
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e1a2b3c4d5f6'
down_revision = 'd2f1a4b6c8e0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('user') as batch_op:
        batch_op.add_column(sa.Column('trial_plan', sa.String(length=16), nullable=True))
        batch_op.add_column(sa.Column('trial_ends_at', sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column('trial_used_plus', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('trial_used_suite', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('trial_reminded_j7', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('trial_reminded_j0', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('trial_expired_handled', sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column('utm_campaign', sa.String(length=256), nullable=True))

    op.create_table(
        'trial_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('event', sa.String(length=32), nullable=True),
        sa.Column('plan', sa.String(length=16), nullable=True),
        sa.Column('utm_campaign', sa.String(length=256), nullable=True),
        sa.Column('created_at', sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('trial_events')
    with op.batch_alter_table('user') as batch_op:
        batch_op.drop_column('utm_campaign')
        batch_op.drop_column('trial_expired_handled')
        batch_op.drop_column('trial_reminded_j0')
        batch_op.drop_column('trial_reminded_j7')
        batch_op.drop_column('trial_used_suite')
        batch_op.drop_column('trial_used_plus')
        batch_op.drop_column('trial_ends_at')
        batch_op.drop_column('trial_plan')
